import type { IdenticonType } from 'types/views/address';

export const IDENTICONS: Array<{ label: string; id: IdenticonType; sampleBg: string }> = [
  {
    label: 'Metamask jazzicon',
    id: 'jazzicon',
    sampleBg: 'url("/static/identicon_logos/jazzicon.png") center / contain no-repeat',
  },
  {
    label: 'Ethereum blockies',
    id: 'blockie',
    sampleBg: 'url("/static/identicon_logos/blockies.png") center / contain no-repeat',
  },
  {
    label: 'Gradient avatar',
    id: 'gradient_avatar',
    sampleBg: 'url("/static/identicon_logos/gradient_avatar.png") center / contain no-repeat',
  },
];
