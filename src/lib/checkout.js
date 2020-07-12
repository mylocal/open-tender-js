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
