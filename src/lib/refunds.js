export const makeCartLookup = (cart) => {
  const lookup = {}
  cart.forEach((item) => {
    const { line_no, quantity, price_total } = item
    lookup[line_no] = { quantity, price_total }
    item.groups.forEach((group) =>
      group.options.forEach((option) => {
        const { line_no, quantity, price } = option
        lookup[line_no] = { quantity, price }
      })
    )
  })
  return lookup
}

export const makeAmountsLookup = (items, key = 'id') => {
  return items.reduce((obj, i) => ({ ...obj, [i[key]]: i.amount }), {})
}

export const makeRefundLookup = (order) => {
  const {
    cart,
    gift_cards,
    surcharges,
    discounts,
    taxes,
    totals,
    tenders,
  } = order
  const {
    subtotal,
    gift_card,
    surcharge,
    discount,
    tax,
    tip,
    shipping,
    total,
  } = totals
  return {
    cart: makeCartLookup(cart),
    gift_cards: makeAmountsLookup(gift_cards, 'code'),
    surcharges: makeAmountsLookup(surcharges),
    discounts: makeAmountsLookup(discounts),
    taxes: makeAmountsLookup(taxes),
    tenders: makeAmountsLookup(tenders, 'tender_index'),
    subtotal,
    gift_card,
    surcharge,
    discount,
    tax,
    tip,
    shipping,
    total,
  }
}

const adjustAmount = (amount, refundAmount) => {
  return (parseFloat(amount) + parseFloat(refundAmount)).toFixed(2)
}

export const adjustAmounts = (order, lookup, list, key = 'id') => {
  if (!order[list]) return order
  order[list].forEach((i) => {
    const amount = lookup[list][i[key]]
    if (amount) i.amount = adjustAmount(i.amount, amount)
  })
  return order
}

const amounts = [
  'subtotal',
  'gift_card',
  'surcharge',
  'discount',
  'tax',
  'tip',
  'shipping',
  'total',
]

export const makeNetOrder = (order, refunds) => {
  if (!refunds || !refunds.length) return order
  let copy = JSON.parse(JSON.stringify(order))
  refunds.forEach((refund) => {
    const lookup = makeRefundLookup(refund)
    copy.cart.forEach((i) => {
      const item = lookup.cart[i.line_no]
      if (item) {
        i.quantity -= item.quantity
        i.price_total = adjustAmount(i.price_total, item.price_total)
      }
      if (i.quantity === 0) {
        i.groups.forEach((group) =>
          group.options.forEach((option) => {
            option.quantity = 0
            option.price_total = '0.00'
          })
        )
      }
    })
    copy = adjustAmounts(copy, lookup, 'gift_cards', 'code')
    copy = adjustAmounts(copy, lookup, 'surcharges')
    copy = adjustAmounts(copy, lookup, 'discounts')
    copy = adjustAmounts(copy, lookup, 'taxes')
    copy = adjustAmounts(copy, lookup, 'tenders', 'tender_index')
    amounts.forEach((i) => {
      copy.totals[i] = adjustAmount(copy.totals[i], lookup[i])
    })
  })
  return copy
}
