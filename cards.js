import { amex, discover, mastercard, visa, creditcard } from '../assets'
import { isNum, isEmpty } from './helpers'

// https://github.com/muffinresearch/payment-icons
export const cardIcons = {
  VISA: visa,
  MC: mastercard,
  DISC: discover,
  AMEX: amex,
  OTHER: creditcard,
}

export const cardNames = {
  VISA: 'Visa',
  MC: 'Mastercard',
  DISC: 'Discover',
  AMEX: 'American Express',
  OTHER: 'Other Credit Card',
}

// https://github.com/jasminmif/react-interactive-paycard
export const cardNumbersRegex = {
  VISA: '^4',
  MC: '^5[1-5]',
  DISC: '^6011',
  AMEX: '^(34|37)',
  // unionpay: '^62',
  // troy: '^9792'
}

export const getCardType = (cardNumber) => {
  const number = cardNumber
  let re
  for (const [card, pattern] of Object.entries(cardNumbersRegex)) {
    re = new RegExp(pattern)
    if (number.match(re) !== null) {
      return card
    }
  }
  return 'OTHER' // default type
}

const chunks = [
  [0, 4],
  [4, 8],
  [8, 12],
  [12, 16],
]

const amexChunks = [
  [0, 4],
  [4, 10],
  [10, 15],
]

export const makeAcctNumber = (str, cardType) => {
  str = str.match(/\d+/g) // limit to numerical input, returns an array
  if (!str) return ''
  str = str.join('').replace(/\s/g, '')
  if (cardType === 'AMEX') {
    return amexChunks
      .map(([start, end]) => str.slice(start, end))
      .filter((i) => i.length)
      .join(' ')
      .slice(0, 18)
  } else {
    return chunks
      .map(([start, end]) => str.slice(start, end))
      .filter((i) => i.length)
      .join(' ')
      .slice(0, 19)
  }
}

export const validateCreditCard = (card, cardType) => {
  const errors = {}
  let { acct, exp, cvv, zip } = card

  const acctLength = cardType === 'AMEX' ? 15 : 16
  acct = acct ? acct.replace(/\s/g, '') : ''
  if (!isNum(acct)) {
    errors.acct = 'Card number must be only numbers'
  } else if (acct.length !== acctLength) {
    errors.acct = `Card number must be ${acctLength} digits`
  }

  exp = (exp ? exp.replace(/\s/g, '') : '').padStart(4, '0')
  const expMonth = exp.slice(0, 2)
  const expYear = exp.slice(2, 4)
  if (!isNum(exp) || exp.length !== 4) {
    errors.exp = 'Expiration must be 4 digits in MMYY format'
  } else if (expMonth < 1 || expMonth > 12) {
    errors.exp = 'Expiration month must be number between 1 and 12'
  } else if (expYear < 20) {
    errors.exp = 'Expiration year must be 2020 or later'
  }

  const cvvLength = cardType === 'AMEX' ? 4 : 3
  cvv = cvv ? cvv.replace(/\s/g, '') : ''
  if (!isNum(cvv)) {
    errors.cvv = 'CVV must be only numbers'
  } else if (cvv.length !== cvvLength) {
    errors.cvv = `CVV must be ${cvvLength} digits`
  }

  zip = zip ? zip.replace(/\s/g, '') : ''
  if (!isNum(zip)) {
    errors.zip = 'Zip code must be only numbers'
  } else if (zip.length !== 5) {
    errors.zip = 'Zip code must be 5 digits'
  }

  if (!isEmpty(errors)) {
    return { card, errors }
  }
  card = { ...card, acct, exp, cvv, zip }
  return { card, errors: null }
}
