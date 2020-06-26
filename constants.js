export const serviceTypeNamesMap = {
  PICKUP: 'Pickup',
  DELIVERY: 'Delivery',
}

export const orderTypeNamesMap = {
  OLO: 'Regular',
  CATERING: 'Catering',
  MERCH: 'Merch',
}

export const otherOrderTypesMap = {
  PICKUP: ['Delivery', 'Catering'],
  DELIVERY: ['Pickup', 'Catering'],
  CATERING: ['Pickup', 'Delivery'],
}

export const tenderTypeNamesMap = {
  CASH: 'Cash',
  CREDIT: 'Credit',
  LEVELUP: 'LevelUp',
  HOUSE_ACCOUNT: 'House Account',
  GIFT_CARD: 'Gift Card',
  COMP: 'Comp',
}

export const loyaltyType = {
  CREDIT: 'CREDIT',
  PROMO_CODE: 'PROMO_CODE',
}

export const MAX_DISTANCE = 100
