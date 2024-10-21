import type { PlacementWithLogical } from '@chakra-ui/react';
import { Tooltip, useDisclosure } from '@chakra-ui/react';
import debounce from 'lodash/debounce';
import React, { useEffect, useCallback, useRef, useState } from 'react';

import { BODY_TYPEFACE } from 'theme/foundations/typography';

interface Props {
  children: React.ReactNode;
  label: string;
  placement?: PlacementWithLogical;
}

const TruncatedTextTooltip = ({ children, label, placement }: Props) => {
  const childRef = useRef<HTMLElement>(null);
  const [isTruncated, setTruncated] = useState(false);
  const { isOpen, onToggle, onOpen, onClose } = useDisclosure();
  const [isFontLoaded, setIsFontLoaded] = useState(false);

  const updatedTruncateState = useCallback(() => {
    if (childRef.current) {
      const scrollWidth = childRef.current.scrollWidth;
      const clientWidth = childRef.current.clientWidth;

      if (scrollWidth > clientWidth) {
        setTruncated(true);
      } else {
        setTruncated(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isFontLoaded) {
      updatedTruncateState();
    }
  }, [updatedTruncateState, isFontLoaded]);

  useEffect(() => {
    const handleResize = debounce(updatedTruncateState, 1000);
    window.addEventListener('resize', handleResize);

    return function cleanup() {
      window.removeEventListener('resize', handleResize);
    };
  }, [updatedTruncateState]);

  // Detect when the font is loaded
  useEffect(() => {
    const onFontsLoaded = () => setIsFontLoaded(true);
    document.fonts.ready.then(onFontsLoaded).catch(() => setIsFontLoaded(true)); // Fallback to true if font load fails
  }, []);

  // as for now it supports only one child
  // and it is not clear how to manage case with two or more children
  const child = React.Children.only(children) as React.ReactElement & {
    ref?: React.Ref<React.ReactNode>;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
  };

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onToggle();
    },
    [onToggle]
  );

  const modifiedChildren = React.cloneElement(child, {
    ref: childRef,
    onClick: handleClick,
    onMouseEnter: onOpen,
    onMouseLeave: onClose,
  });

  if (isTruncated) {
    return (
      <Tooltip
        label={label}
        maxW={{ base: 'calc(100vw - 8px)', lg: '400px' }}
        placement={placement}
        isOpen={isOpen}
      >
        {modifiedChildren}
      </Tooltip>
    );
  }

  return modifiedChildren;
};

export default React.memo(TruncatedTextTooltip);
