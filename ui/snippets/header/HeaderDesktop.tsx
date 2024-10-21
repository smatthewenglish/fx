import { HStack, Box } from '@chakra-ui/react';
import React from 'react';

import NetworkLogo from 'ui/snippets/networkMenu/NetworkLogo';
import SearchBar from 'ui/snippets/searchBar/SearchBar';

import Burger from './Burger';

type Props = {
  renderSearchBar?: () => React.ReactNode;
  isMarketplaceAppPage?: boolean;
}

const HeaderDesktop = ({ renderSearchBar, isMarketplaceAppPage }: Props) => {

  const searchBar = renderSearchBar ? renderSearchBar() : <SearchBar/>;

  return (
    <HStack
      as="header"
      display={{ base: 'none', lg: 'flex' }}
      width="100%"
      alignItems="center"
      justifyContent="center"
      gap={ 12 }
    >
      { isMarketplaceAppPage && (
        <Box display="flex" alignItems="center" gap={ 3 }>
          <Burger isMarketplaceAppPage/>
          <NetworkLogo isCollapsed/>
        </Box>
      ) }
      <Box width="100%">
        { searchBar }
      </Box>
    </HStack>
  );
};

export default React.memo(HeaderDesktop);
