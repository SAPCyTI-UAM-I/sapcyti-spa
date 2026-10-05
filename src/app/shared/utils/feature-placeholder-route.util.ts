import type { Data } from '@angular/router';

import type { I18nKey } from '../../core/i18n/i18n-keys.generated';

export interface FeaturePlaceholderRouteData {
  readonly titleKey: I18nKey;
  readonly messageKey: I18nKey;
}

const FALLBACK_ROUTE_DATA: FeaturePlaceholderRouteData = {
  titleKey: 'COMMON.ERRORS.NOT_FOUND',
  messageKey: 'COMMON.ERRORS.SERVER_ERROR',
};

export function readFeaturePlaceholderRouteData(data: Data): FeaturePlaceholderRouteData {
  const titleKey = data['titleKey'];
  const messageKey = data['messageKey'];

  if (typeof titleKey !== 'string' || typeof messageKey !== 'string') {
    return FALLBACK_ROUTE_DATA;
  }

  return { titleKey: titleKey as I18nKey, messageKey: messageKey as I18nKey };
}
