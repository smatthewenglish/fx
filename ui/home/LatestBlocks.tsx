import { chakra, Box, Heading, Flex, Text, VStack, Skeleton } from '@chakra-ui/react';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import React, { useState } from 'react';

import type { SocketMessage } from 'lib/socket/types';
import type { Block } from 'types/api/block';

import { route } from 'nextjs-routes';

import config from 'configs/app';
import useApiQuery, { getResourceKey } from 'lib/api/useApiQuery';
import useIsMobile from 'lib/hooks/useIsMobile';
import { nbsp } from 'lib/html-entities';
import useSocketChannel from 'lib/socket/useSocketChannel';
import useSocketMessage from 'lib/socket/useSocketMessage';
import { BLOCK } from 'stubs/block';
import { HOMEPAGE_STATS } from 'stubs/stats';
import LinkInternal from 'ui/shared/links/LinkInternal';

import LatestBlocksItem from './LatestBlocksItem';

const LatestBlocks = () => {
  const isMobile = useIsMobile();
  const [apiInfo, setApiInfo] = useState(""); // State to hold API info for displaying on the screen

  let blocksMaxCount: number;
  if (config.features.rollup.isEnabled || config.UI.views.block.hiddenFields?.total_reward) {
    blocksMaxCount = isMobile ? 4 : 5;
  } else {
    blocksMaxCount = isMobile ? 2 : 3;
  }

  const blocksApiEndpoint = '/api/homepage_blocks';
  const statsApiEndpoint = '/api/stats';

  // Fetching blocks data
  const { data, isPlaceholderData, isError } = useApiQuery('homepage_blocks', {
    queryOptions: {
      placeholderData: Array(blocksMaxCount).fill(BLOCK),
      onSuccess: (responseData) => {
        setApiInfo(`API Call Success - Latest Blocks: ${JSON.stringify(responseData)}\nEndpoint: ${blocksApiEndpoint}`);
      },
      onError: (error) => {
        setApiInfo(`API Call Error - Latest Blocks: ${JSON.stringify(error)}\nEndpoint: ${blocksApiEndpoint}`);
      },
      onSettled: (data, error) => {
        setApiInfo(`API Call Settled - Latest Blocks: ${JSON.stringify({ data, error })}\nEndpoint: ${blocksApiEndpoint}`);
      }
    },
  });

  const queryClient = useQueryClient();

  // Fetching stats data
  const statsQueryResult = useApiQuery('stats', {
    queryOptions: {
      refetchOnMount: false,
      placeholderData: HOMEPAGE_STATS,
      onSuccess: (responseData) => {
        setApiInfo(`API Call Success - Stats: ${JSON.stringify(responseData)}\nEndpoint: ${statsApiEndpoint}`);
      },
      onError: (error) => {
        setApiInfo(`API Call Error - Stats: ${JSON.stringify(error)}\nEndpoint: ${statsApiEndpoint}`);
      },
      onSettled: (data, error) => {
        setApiInfo(`API Call Settled - Stats: ${JSON.stringify({ data, error })}\nEndpoint: ${statsApiEndpoint}`);
      }
    },
  });

  const handleNewBlockMessage: SocketMessage.NewBlock['handler'] = React.useCallback((payload) => {
    queryClient.setQueryData(getResourceKey('homepage_blocks'), (prevData: Array<Block> | undefined) => {

      const newData = prevData ? [ ...prevData ] : [];

      if (newData.some((block => block.height === payload.block.height))) {
        return newData;
      }

      return [ payload.block, ...newData ].sort((b1, b2) => b2.height - b1.height).slice(0, blocksMaxCount);
    });
  }, [ queryClient, blocksMaxCount ]);

  const channel = useSocketChannel({
    topic: 'blocks:new_block',
    isDisabled: isPlaceholderData || isError,
  });
  
  useSocketMessage({
    channel,
    event: 'new_block',
    handler: handleNewBlockMessage,
  });

  let content;

  if (isError) {
    content = <Text>No data. Please reload the page.</Text>;
  }

  if (data) {
    const dataToShow = data.slice(0, blocksMaxCount);

    content = (
      <>
        <VStack spacing={ 2 } mb={ 3 } overflow="hidden" alignItems="stretch">
          <AnimatePresence initial={ false } >
            { dataToShow.map(((block, index) => (
              <LatestBlocksItem
                key={ block.height + (isPlaceholderData ? String(index) : '') }
                block={ block }
                isLoading={ isPlaceholderData }
              />
            ))) }
          </AnimatePresence>
        </VStack>
        <Flex justifyContent="center">
          <LinkInternal fontSize="sm" href={ route({ pathname: '/blocks' }) }>View all blocks</LinkInternal>
        </Flex>
      </>
    );
  }

  return (
    <Box width={{ base: '100%', lg: '280px' }} flexShrink={ 0 }>
      <Heading as="h4" size="sm">Latest blocks</Heading>
      
      {statsQueryResult.data?.network_utilization_percentage !== undefined && (
        <Skeleton isLoaded={!statsQueryResult.isPlaceholderData} mt={1} display="inline-block">
          <Text as="span" fontSize="sm">
            Network utilization:{nbsp}
          </Text>
          <Text as="span" fontSize="sm" color="blue.400" fontWeight={700}>
            {statsQueryResult.data?.network_utilization_percentage.toFixed(2)}%
          </Text>
        </Skeleton>
      )}

      {statsQueryResult.data?.celo && (
        <Box whiteSpace="pre-wrap" fontSize="sm">
          <span>Current epoch: </span>
          <chakra.span fontWeight={700}>#{statsQueryResult.data.celo.epoch_number}</chakra.span>
        </Box>
      )}
      
      <Box mt={3}>
        {content}
      </Box>

      {/* Display API Call and Endpoint Information */}
      <Box mt={3} p={3} bg="gray.100">
        <Text fontSize="sm" color="red.500" whiteSpace="pre-wrap">{apiInfo}</Text>
      </Box>
    </Box>
  );
};

export default LatestBlocks;
