import React from 'react';

import type { WalletType } from 'types/client/wallets';
import type { WalletProvider } from 'types/web3';

export default function useProvider() {
  const [ provider, setProvider ] = React.useState<WalletProvider>();
  const [ wallet, setWallet ] = React.useState<WalletType>();

  const initializeProvider = React.useMemo(() => async() => {}, []);

  React.useEffect(() => {
    initializeProvider();
  }, [ initializeProvider ]);

  return { provider, wallet };
}
