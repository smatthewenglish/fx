import React from 'react';

import useToast from 'lib/hooks/useToast';
import * as mixpanel from 'lib/mixpanel/index';
import useProvider from 'lib/web3/useProvider';
import IconSvg from 'ui/shared/IconSvg';

const NetworkAddToWallet = () => {
  const toast = useToast();
  const { provider, wallet } = useProvider();

  return null;
};

export default React.memo(NetworkAddToWallet);
