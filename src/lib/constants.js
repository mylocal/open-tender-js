export const serviceTypeNamesMap = {
  WALKIN: 'Dine-In',
  PICKUP: 'Pickup',
  DELIVERY: 'Delivery',
}

export const otherServiceTypeNamesMap = {
  WALKIN: 'Delivery',
  PICKUP: 'Delivery',
  DELIVERY: 'Pickup',
}

export const orderTypeNamesMap = {
  OLO: 'Regular',
  CATERING: 'Catering',
  MERCH: 'Merch',
}

export const otherOrderTypesMap = {
  WALKIN: ['Delivery', 'Catering'],
  PICKUP: ['Delivery', 'Catering'],
  DELIVERY: ['Pickup', 'Catering'],
  CATERING: ['Pickup', 'Delivery'],
  MERCH: ['Pickup', 'Delivery'],
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
