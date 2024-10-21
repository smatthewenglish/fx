import type { As } from '@chakra-ui/react';
import { Tooltip, chakra } from '@chakra-ui/react';
import _debounce from 'lodash/debounce';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { BODY_TYPEFACE, HEADING_TYPEFACE } from 'theme/foundations/typography';

const TAIL_LENGTH = 4;
const HEAD_MIN_LENGTH = 4;

interface Props {
  hash: string;
  fontWeight?: string | number;
  isTooltipDisabled?: boolean;
  tailLength?: number;
  as?: As;
}

const HashStringShortenDynamic = ({
  hash,
  fontWeight = '400',
  isTooltipDisabled,
  tailLength = TAIL_LENGTH,
  as = 'span',
}: Props) => {
  const elementRef = useRef<HTMLSpanElement>(null);
  const [displayedString, setDisplayedString] = useState(hash);
  const [isFontLoaded, setIsFontLoaded] = useState(false);

  const calculateString = useCallback(() => {
    const parent = elementRef?.current?.parentNode as HTMLElement;
    if (!parent) {
      return;
    }

    const shadowEl = document.createElement('span');
    shadowEl.style.opacity = '0';
    parent.appendChild(shadowEl);
    shadowEl.textContent = hash;

    const parentWidth = getWidth(parent);

    if (getWidth(shadowEl) > parentWidth) {
      const tail = hash.slice(-tailLength);
      let leftI = HEAD_MIN_LENGTH;
      let rightI = hash.length - tailLength;

      while (rightI - leftI > 1) {
        const medI = ((rightI - leftI) % 2) ? leftI + (rightI - leftI + 1) / 2 : leftI + (rightI - leftI) / 2;
        const res = hash.slice(0, medI) + '...' + tail;
        shadowEl.textContent = res;
        if (getWidth(shadowEl) < parentWidth) {
          leftI = medI;
        } else {
          rightI = medI;
        }
      }
      setDisplayedString(hash.slice(0, rightI - 1) + '...' + tail);
    } else {
      setDisplayedString(hash);
    }

    parent.removeChild(shadowEl);
  }, [hash, tailLength]);

  useEffect(() => {
    if (isFontLoaded) {
      calculateString();
    }
  }, [calculateString, isFontLoaded]);

  useEffect(() => {
    const resizeHandler = _debounce(calculateString, 100);
    const resizeObserver = new ResizeObserver(resizeHandler);

    resizeObserver.observe(document.body);
    return function cleanup() {
      resizeObserver.unobserve(document.body);
    };
  }, [calculateString]);

  // Font loading detection
  useEffect(() => {
    const onFontsLoaded = () => setIsFontLoaded(true);
    document.fonts.ready.then(onFontsLoaded).catch(() => setIsFontLoaded(true)); // Fallback to true if font load fails
  }, []);

  const content = (
    <chakra.span ref={elementRef} as={as}>
      {displayedString}
    </chakra.span>
  );
  const isTruncated = hash.length !== displayedString.length;

  if (isTruncated) {
    return (
      <Tooltip label={hash} isDisabled={isTooltipDisabled} maxW={{ base: 'calc(100vw - 8px)', lg: '400px' }}>
        {content}
      </Tooltip>
    );
  }

  return content;
};

function getWidth(el: HTMLElement) {
  return el.getBoundingClientRect().width;
}

export default React.memo(HashStringShortenDynamic);
