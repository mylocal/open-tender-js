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
  APPLE_PAY: 'Apple Pay',
  GOOGLE_PAY: 'Google Pay',
}

export const loyaltyType = {
  CREDIT: 'CREDIT',
  PROMO_CODE: 'PROMO_CODE',
}

export const MAX_DISTANCE = 100

export const prepStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  COMPLETED: 'COMPLETED',
  FULFILLED: 'FULFILLED',
}

export const optionsOrderNotifications = [
  { name: 'Email Only', value: 'EMAIL' },
  { name: 'SMS Only', value: 'SMS' },
  { name: 'Both Email & SMS', value: 'ALL' },
  { name: 'Neither', value: 'NONE' },
]
