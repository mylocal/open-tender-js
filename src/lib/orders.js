import { prepStatus } from './constants'
import {
  timezoneMap,
  isoToDate,
  currentLocalDate,
  makeIntervals,
} from './datetimes'

export const notDone = (prep_status) => {
  const notDoneStates = [prepStatus.TODO, prepStatus.IN_PROGRESS]
  return notDoneStates.includes(prep_status)
}

const updateCounts = (counts, ticketCounts) => {
  // console.log('BEFORE', counts, ticketCounts)
  const updated = Object.entries(counts).reduce((obj, [key, count]) => {
    return { ...obj, [key]: count + (ticketCounts[key] || 0) }
  }, {})
  updated.Orders = counts.Orders + 1
  // console.log('AFTER', updated)
  return updated
}

export const makeOrdersCounts = (itemTypes = [], orders = []) => {
  const itemTypeCounts = itemTypes
    .filter((i) => !i.is_grouped)
    .reduce((obj, i) => ({ ...obj, [i.name]: 0 }), {})
  let current = { Orders: 0, ...itemTypeCounts }
  let future = { Orders: 0, ...itemTypeCounts }
  const openOrders = orders.filter((i) => notDone(i.prep_status))
  openOrders.forEach((order) => {
    const tz = timezoneMap[order.timezone]
    const fireDate = isoToDate(order.fire_at, tz)
    const currentDate = currentLocalDate(tz)
    const isCurrent = fireDate < currentDate
    const ticketCounts = order.tickets.reduce((obj, ticket) => {
      const count = obj[ticket.item_type_name] || 0
      return {
        ...obj,
        [ticket.item_type_name]: count + ticket.item_nos.length,
      }
    }, {})
    if (isCurrent) {
      current = updateCounts(current, ticketCounts)
    } else {
      future = updateCounts(future, ticketCounts)
    }
  })
  return { current, future }
}

export const makeOrderBuckets = (orders, tz) => {
  const intervals = makeIntervals(tz)
  const withOrders = intervals.map((i) => {
    const inBucket = orders.filter((order) => {
      const readyAt = isoToDate(order.ready_at, tz)
      return i.start < readyAt && readyAt <= i.end
    })
    return { ...i, orders: inBucket }
  })
  return withOrders
}
