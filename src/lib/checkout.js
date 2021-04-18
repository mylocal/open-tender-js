import { checkAmountRemaining } from './cart'
import { tenderTypeNamesMap } from './constants'

export const adjustTenders = (tenders, isPaid, amountRemaining, updateForm) => {
  if (!tenders.length || isPaid) return
  const gift = tenders.filter((i) => i.tender_type === 'GIFT_CARD')
  const nonGift = tenders.filter((i) => i.tender_type !== 'GIFT_CARD')
  if (amountRemaining > 0) {
    if (!nonGift.length) return
    const newTenders = nonGift.map((i) => {
      const newAmount = parseFloat(i.amount) + amountRemaining
      amountRemaining = 0.0
      return { ...i, amount: newAmount.toFixed(2) }
    })
    updateForm({ tenders: [...gift, ...newTenders] })
    isPaid = Math.abs(amountRemaining).toFixed(2) === '0.00'
  } else {
    const newTenders = nonGift.map((i) => {
      const newAmount = Math.max(parseFloat(i.amount) + amountRemaining, 0.0)
      amountRemaining += parseFloat(i.amount) - newAmount
      return { ...i, amount: newAmount.toFixed(2) }
    })
    isPaid = Math.abs(amountRemaining).toFixed(2) === '0.00'
    if (isPaid) {
      const nonZero = newTenders.filter((i) => i.amount !== '0.00')
      updateForm({ tenders: [...gift, ...nonZero] })
    } else {
      const newGift = gift.map((i) => {
        const newAmount = Math.max(parseFloat(i.amount) + amountRemaining, 0.0)
        amountRemaining += parseFloat(i.amount) - newAmount
        return { ...i, amount: newAmount.toFixed(2) }
      })
      const allNew = [...newGift, ...newTenders].filter(
        (i) => i.amount !== '0.00'
      )
      updateForm({ tenders: allNew })
      isPaid = Math.abs(amountRemaining).toFixed(2) === '0.00'
    }
  }
}

export const updateTenders = (tenders, total) => {
  if (!total || !tenders || !tenders.length) return null
  let amountRemaining = checkAmountRemaining(total, tenders)
  if (amountRemaining === 0) return null
  const gift = tenders.filter((i) => i.tender_type === 'GIFT_CARD')
  const nonGift = tenders.filter((i) => i.tender_type !== 'GIFT_CARD')
  if (amountRemaining > 0) {
    if (!nonGift.length) return null
    const newTenders = nonGift.map((i) => {
      const newAmount = parseFloat(i.amount) + amountRemaining
      amountRemaining = 0.0
      return { ...i, amount: newAmount.toFixed(2) }
    })
    return [...gift, ...newTenders]
  } else {
    const newTenders = nonGift.map((i) => {
      const newAmount = Math.max(parseFloat(i.amount) + amountRemaining, 0.0)
      amountRemaining += parseFloat(i.amount) - newAmount
      return { ...i, amount: newAmount.toFixed(2) }
    })
    const isPaid = Math.abs(amountRemaining).toFixed(2) === '0.00'
    if (isPaid) {
      const nonZero = newTenders.filter((i) => i.amount !== '0.00')
      return [...gift, ...nonZero]
    } else {
      const newGift = gift.map((i) => {
        const newAmount = Math.max(parseFloat(i.amount) + amountRemaining, 0.0)
        amountRemaining += parseFloat(i.amount) - newAmount
        return { ...i, amount: newAmount.toFixed(2) }
      })
      return [...newGift, ...newTenders].filter((i) => i.amount !== '0.00')
    }
  }
}

export const makeCreditName = (tender) => {
  const creditCard = tender.credit_card || tender
  return `${creditCard.card_type_name} ending in ${creditCard.last4}`
}

export const makeHouseAccountName = (tender) => {
  const houseAccount = tender.house_account || tender
  return `${houseAccount.name} House Account`
}

export const makeTenderName = (tender) => {
  switch (tender.tender_type) {
    case 'CREDIT':
      return makeCreditName(tender)
    case 'GIFT_CARD':
      return `Gift Card ${tender.card_number}`
    case 'HOUSE_ACCOUNT':
      return makeHouseAccountName(tender)
    default:
      return `${tenderTypeNamesMap[tender.tender_type]}`
  }
}
