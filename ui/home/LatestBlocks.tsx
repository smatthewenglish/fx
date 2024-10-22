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
  let blocksMaxCount: number;
  
  const apiPort = '4013'; // Port used by the API

  // API endpoints
  const blocksApiEndpoint = `http://localhost:${apiPort}/api/homepage_blocks`;
  const statsApiEndpoint = `http://localhost:${apiPort}/api/stats`;

  // Set the block max count based on config and screen size
  if (config.features.rollup.isEnabled || config.UI.views.block.hiddenFields?.total_reward) {
    blocksMaxCount = isMobile ? 4 : 5;
  } else {
    blocksMaxCount = isMobile ? 2 : 3;
  }

  // State to capture the API response (even on error)
  const [errorResponse, setErrorResponse] = useState(null);

  // Fetch blocks data
  const { data, isPlaceholderData, isError } = useApiQuery('homepage_blocks', {
    queryOptions: {
      placeholderData: Array(blocksMaxCount).fill(BLOCK),
      onError: (error) => {
        setErrorResponse(error); // Capture the full error response when it occurs
      }
    },
  });

  const queryClient = useQueryClient();

  // Fetch stats data
  const statsQueryResult = useApiQuery('stats', {
    queryOptions: {
      refetchOnMount: false,
      placeholderData: HOMEPAGE_STATS,
      onError: (error) => {
        setErrorResponse(error); // Capture the error response from stats API
      }
    },
  });

  // Handle new block messages over WebSocket
  const handleNewBlockMessage: SocketMessage.NewBlock['handler'] = React.useCallback((payload) => {
    queryClient.setQueryData(getResourceKey('homepage_blocks'), (prevData: Array<Block> | undefined) => {
      const newData = prevData ? [ ...prevData ] : [];
      if (newData.some((block => block.height === payload.block.height))) {
        return newData;
      }
      return [ payload.block, ...newData ].sort((b1, b2) => b2.height - b1.height).slice(0, blocksMaxCount);
    });
  }, [ queryClient, blocksMaxCount ]);

  // Set up WebSocket channel
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

  // Handle error case by displaying detailed information
  if (isError) {
    content = (
      <Box>
        {/* Error Message */}
        <Text>No data. Please reload the page.</Text>
        
        {/* Displaying API Endpoint */}
        <Text mt={3} color="red.600">
          <b>API Endpoint:</b> {blocksApiEndpoint}
        </Text>

        {/* Displaying Port */}
        <Text mt={1} color="red.600">
          <b>API Port:</b> {apiPort}
        </Text>

        {/* Displaying API Call */}
        <Text mt={1} color="red.600">
          <b>API Call:</b> GET {blocksApiEndpoint}
        </Text>

        {/* Displaying Full Error Response */}
        <Text mt={1} color="red.600">
          <b>Full Error Response:</b> {JSON.stringify(errorResponse, null, 2)}
        </Text>
      </Box>
    );
  }

  // Handle successful data fetch
  if (data) {
    const dataToShow = data.slice(0, blocksMaxCount);

    content = (
      <>
        <VStack spacing={2} mb={3} overflow="hidden" alignItems="stretch">
          <AnimatePresence initial={false}>
            {dataToShow.map((block, index) => (
              <LatestBlocksItem
                key={block.height + (isPlaceholderData ? String(index) : '')}
                block={block}
                isLoading={isPlaceholderData}
              />
            ))}
          </AnimatePresence>
        </VStack>
        <Flex justifyContent="center">
          <LinkInternal fontSize="sm" href={route({ pathname: '/blocks' })}>
            View all blocks
          </LinkInternal>
        </Flex>
      </>
    );
  }

  return (
    <Box width={{ base: '100%', lg: '280px' }} flexShrink={0}>
      <Heading as="h4" size="sm">Latest blocks</Heading>

      {/* Stats Section */}
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
        {/* Main Content (Error or Data) */}
        {content}
      </Box>
    </Box>
  );
};

export default LatestBlocks;
