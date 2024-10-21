import { useRouter } from 'next/router';
import React from 'react';

import type { Address } from 'types/api/address';

import useApiQuery from 'lib/api/useApiQuery';
import * as cookies from 'lib/cookies';
import getQueryParamString from 'lib/router/getQueryParamString';
import useSocketChannel from 'lib/socket/useSocketChannel';
import * as stubs from 'stubs/contract';
import ContractCode from 'ui/address/contract/ContractCode';
import { divideAbiIntoMethodTypes } from 'ui/address/contract/methods/utils';

const CONTRACT_TAB_IDS = [
  'contract_code',
  'read_contract',
  'read_contract_rpc',
  'read_proxy',
  'read_custom_methods',
  'write_contract',
  'write_contract_rpc',
  'write_proxy',
  'write_custom_methods',
] as const;

interface ContractTab {
  id: typeof CONTRACT_TAB_IDS[number];
  title: string;
  component: JSX.Element;
}

interface ReturnType {
  tabs: Array<ContractTab>;
  isLoading: boolean;
}

export default function useContractTabs(data: Address | undefined, isPlaceholderData: boolean): ReturnType {
  const [ isQueryEnabled, setIsQueryEnabled ] = React.useState(false);

  const router = useRouter();
  const tab = getQueryParamString(router.query.tab);

  const isEnabled = Boolean(data?.hash) && data?.is_contract && !isPlaceholderData && CONTRACT_TAB_IDS.concat('contract' as never).includes(tab);

  const enableQuery = React.useCallback(() => {
    setIsQueryEnabled(true);
  }, []);

  const contractQuery = useApiQuery('contract', {
    pathParams: { hash: data?.hash },
    queryOptions: {
      enabled: isEnabled && isQueryEnabled,
      refetchOnMount: false,
      placeholderData: data?.is_verified ? stubs.CONTRACT_CODE_VERIFIED : stubs.CONTRACT_CODE_UNVERIFIED,
    },
  });

  const customAbiQuery = useApiQuery('custom_abi', {
    queryOptions: {
      enabled: isEnabled && isQueryEnabled && Boolean(cookies.get(cookies.NAMES.API_TOKEN)),
      refetchOnMount: false,
    },
  });

  const channel = useSocketChannel({
    topic: `addresses:${ data?.hash?.toLowerCase() }`,
    isDisabled: !isEnabled,
    onJoin: enableQuery,
    onSocketError: enableQuery,
  });

  const methods = React.useMemo(() => divideAbiIntoMethodTypes(contractQuery.data?.abi ?? []), [ contractQuery.data?.abi ]);
  const methodsCustomAbi = React.useMemo(() => {
    return divideAbiIntoMethodTypes(
      customAbiQuery.data
        ?.find((item) => data && item.contract_address_hash.toLowerCase() === data.hash.toLowerCase())
        ?.abi ??
        [],
    );
  }, [ customAbiQuery.data, data ]);

  const verifiedImplementations = React.useMemo(() => {
    return data?.implementations?.filter(({ name, address }) => name && address && address !== data?.hash) || [];
  }, [ data?.hash, data?.implementations ]);

  return React.useMemo(() => {
    return {
      tabs: [
        {
          id: 'contract_code' as const,
          title: 'Code',
          component: <ContractCode contractQuery={ contractQuery } channel={ channel } addressHash={ data?.hash }/>,
        },
        methods.read.length > 0 && {
          id: 'read_contract' as const,
          title: 'Read contract',
          component: <ContractCode contractQuery={ contractQuery } channel={ channel } addressHash={ data?.hash }/>,
        },
        methodsCustomAbi.read.length > 0 && {
          id: 'read_custom_methods' as const,
          title: 'Read custom',
          component: <ContractCode contractQuery={ contractQuery } channel={ channel } addressHash={ data?.hash }/>,
        },
        verifiedImplementations.length > 0 && {
          id: 'read_proxy' as const,
          title: 'Read proxy',
          component: (
            <ContractCode contractQuery={ contractQuery } channel={ channel } addressHash={ data?.hash }/>
          ),
        }, 
      ].filter(Boolean),
      isLoading: contractQuery.isPlaceholderData,
    };
  }, [ contractQuery, channel, data?.hash, verifiedImplementations, methods.read, methods.write, methodsCustomAbi.read, methodsCustomAbi.write ]);
}
