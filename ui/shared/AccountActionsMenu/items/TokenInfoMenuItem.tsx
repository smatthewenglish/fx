import { chakra, useDisclosure } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React from 'react';

import type { ItemProps } from '../types';

import config from 'configs/app';
import useApiQuery from 'lib/api/useApiQuery';
import useHasAccount from 'lib/hooks/useHasAccount';
import IconSvg from 'ui/shared/IconSvg';

import ButtonItem from '../parts/ButtonItem';
import MenuItem from '../parts/MenuItem';

const TokenInfoMenuItem = ({ className, hash, onBeforeClick, type }: ItemProps) => {
  const router = useRouter();
  const modal = useDisclosure();
  const isAuth = useHasAccount();

  const verifiedAddressesQuery = useApiQuery('verified_addresses', {
    pathParams: { chainId: config.chain.id },
    queryOptions: {
      enabled: isAuth,
    },
  });
  const applicationsQuery = useApiQuery('token_info_applications', {
    pathParams: { chainId: config.chain.id, id: undefined },
    queryOptions: {
      enabled: isAuth,
    },
  });
  const tokenInfoQuery = useApiQuery('token_verified_info', {
    pathParams: { hash, chainId: config.chain.id },
    queryOptions: {
      refetchOnMount: false,
    },
  });

  const handleAddAddressClick = React.useCallback(() => {
    if (!onBeforeClick({ pathname: '/account/verified-addresses' })) {
      return;
    }

    modal.onOpen();
  }, [ modal, onBeforeClick ]);

  const handleAddApplicationClick = React.useCallback(async() => {
    router.push({ pathname: '/account/verified-addresses', query: { address: hash } });
  }, [ hash, router ]);

  const handleVerifiedAddressSubmit = React.useCallback(async() => {
    await verifiedAddressesQuery.refetch();
  }, [ verifiedAddressesQuery ]);

  const handleShowMyAddressesClick = React.useCallback(async() => {
    router.push({ pathname: '/account/verified-addresses' });
  }, [ router ]);

  const element = (() => {
    const icon = <IconSvg name="edit" boxSize={ 6 } p={ 1 }/>;
    const isVerifiedAddress = verifiedAddressesQuery.data?.verifiedAddresses
      .find(({ contractAddress }) => contractAddress.toLowerCase() === hash.toLowerCase());
    const hasApplication = applicationsQuery.data?.submissions.some(({ tokenAddress }) => tokenAddress.toLowerCase() === hash.toLowerCase());

    const label = (() => {
      if (!isVerifiedAddress) {
        return tokenInfoQuery.data?.tokenAddress ? 'Update token info' : 'Add token info';
      }

      return hasApplication || tokenInfoQuery.data?.tokenAddress ? 'Update token info' : 'Add token info';
    })();

    const onClick = isVerifiedAddress ? handleAddApplicationClick : handleAddAddressClick;

    switch (type) {
      case 'button': {
        return <ButtonItem label={ label } icon={ icon } onClick={ onClick } className={ className }/>;
      }
      case 'menu_item': {
        return (
          <MenuItem className={ className } onClick={ onClick }>
            { icon }
            <chakra.span ml={ 2 }>{ label }</chakra.span>
          </MenuItem>
        );
      }
    }
  })();

  return (
    <>
      { element }
    </>
  );
};

export default React.memo(TokenInfoMenuItem);
