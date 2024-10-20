import * as descriptors from './policies';
import { makePolicyString, mergeDescriptors } from './utils';

function generateCspPolicy() {
  const policyDescriptor = mergeDescriptors(
    descriptors.app(),
    descriptors.cloudFlare(),
    descriptors.gasHawk(),
    descriptors.googleAnalytics(),
    descriptors.googleFonts(),
    descriptors.googleReCaptcha(),
    descriptors.growthBook(),
    descriptors.marketplace(),
    descriptors.mixpanel(),
    descriptors.monaco(),
    descriptors.safe(),
    descriptors.sentry(),
    descriptors.usernameApi(),
  );

  return makePolicyString(policyDescriptor);
}

export default generateCspPolicy;
