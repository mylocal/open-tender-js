import { prepStatus, tenderTypeNamesMap } from './constants'
import { capitalize } from './helpers'
import {
  timezoneMap,
  isoToDate,
  currentLocalDate,
  makeIntervals,
} from './datetimes'

export const makeChannelName = (channel) => {
  switch (channel.type) {
    case 'ONLINE':
      return 'Web'
    case 'APP':
      return 'App'
    case 'PORTAL':
      return channel.ext_name
    default:
      return channel.type
  }
}

export const makeTenderTypeName = (tenderType) => {
  const name = tenderTypeNamesMap[tenderType]
  return name || capitalize(tenderType.replace('_', ' '))
}

export const notDone = (prep_status) => {
  const notDoneStates = [prepStatus.TODO, prepStatus.IN_PROGRESS]
  return notDoneStates.includes(prep_status)
}

export const isDone = (prep_status) => {
  const doneStates = [
    prepStatus.DONE,
    prepStatus.COMPLETED,
    prepStatus.FULFILLED,
  ]
  return doneStates.includes(prep_status)
}

export const notCompleted = (prep_status) => {
  const notCompletedStates = [
    prepStatus.TODO,
    prepStatus.IN_PROGRESS,
    prepStatus.DONE,
  ]
  return notCompletedStates.includes(prep_status)
}

export const isCompleted = (prep_status) => {
  const completeStates = [prepStatus.COMPLETED, prepStatus.FULFILLED]
  return completeStates.includes(prep_status)
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
  let qa = { Orders: 0, ...itemTypeCounts }
  let future = { Orders: 0, ...itemTypeCounts }
  const openOrders = orders.filter((i) => notCompleted(i.prep_status))
  openOrders.forEach((order) => {
    const tz = timezoneMap[order.timezone]
    const fireDate = isoToDate(order.fire_at, tz)
    const currentDate = currentLocalDate(tz)
    const isDone = order.prep_status === prepStatus.DONE
    const isCurrent = fireDate < currentDate
    const ticketCounts = order.tickets.reduce((obj, ticket) => {
      const count = obj[ticket.item_type_name] || 0
      return {
        ...obj,
        [ticket.item_type_name]: count + ticket.item_nos.length,
      }
    }, {})
    if (isDone) {
      qa = updateCounts(qa, ticketCounts)
    } else if (isCurrent) {
      current = updateCounts(current, ticketCounts)
    } else {
      future = updateCounts(future, ticketCounts)
    }
  })
  return { current, future, qa }
}

export const makeOrderBuckets = (orders, tz, prepStates = []) => {
  const intervals = makeIntervals(tz)
  const withOrders = intervals.map((i) => {
    const inBucket = orders.filter((order) => {
      const incomplete = prepStates.includes(order.prep_status)
      const readyAt = isoToDate(order.ready_at, tz)
      return incomplete && i.start < readyAt && readyAt <= i.end
    })
    return { ...i, orders: inBucket }
  })
  return withOrders
}

export const makeOrderBucketsCounts = (itemTypes = [], orders = []) => {
  const itemTypeCounts = itemTypes
    .filter((i) => !i.is_grouped)
    .reduce((obj, i) => ({ ...obj, [i.name]: 0 }), {})
  let counts = { Orders: 0, ...itemTypeCounts }
  orders.forEach((order) => {
    const ticketCounts = order.tickets.reduce((obj, ticket) => {
      const count = obj[ticket.item_type_name] || 0
      return {
        ...obj,
        [ticket.item_type_name]: count + ticket.item_nos.length,
      }
    }, {})
    counts = updateCounts(counts, ticketCounts)
  })
  return counts
}

export const makeTicketCounts = (tickets) => {
  return tickets.reduce((obj, i) => {
    const count = obj[i.item_type_id] || 0
    return { ...obj, [i.item_type_id]: count + i.item_nos.length }
  }, {})
}

export const makeCartLookup = (cart) => {
  return cart.reduce((obj, i) => ({ ...obj, [i.item_no]: i }), {})
}

export const makeItemTypeSettings = (itemType) => {
  const {
    is_default,
    is_grouped,
    is_hidden_assembly,
    is_hidden_qa,
    print_on_completed,
  } = itemType || {}
  return {
    is_default,
    is_grouped,
    is_hidden_assembly,
    is_hidden_qa,
    print_on_completed,
  }
}

export const makeItemTypesMap = (itemTypes) => {
  return itemTypes
    ? itemTypes.reduce((obj, i) => ({ ...obj, [i.item_type_id]: i }), {})
    : {}
}

export const makeTicketGroups = (tickets, cart, itemTypes, isAssembly) => {
  const lookup = makeCartLookup(cart)
  const grouped = tickets.reduce((obj, i) => {
    const items = i.item_nos.map((n) => lookup[n])
    const settings = makeItemTypeSettings(itemTypes[i.item_type_id])
    const hideTicket = isAssembly && settings.is_hidden_assembly
    const ticket = { ...i, items, ...settings }
    const group = obj[i.item_type_id] || []
    const newGroup = hideTicket ? group : [...group, ticket]
    return { ...obj, [i.item_type_id]: newGroup }
  }, {})
  return Object.values(grouped)
}

export const makeDisplayCounts = (counts) => {
  if (!counts) return ''
  return Object.entries(counts).map(([, value]) => value)
}

export const displayCounts = (counts) => {
  if (!counts) return ''
  const countStr = Object.entries(counts)
    // .map(([key, value]) => `${value}-${key.charAt(0)}`)
    .map(([, value]) => `${value}`)
    .join('/')
  return ` (${countStr})`
}

export const makeColor = (settings, minutes) => {
  const { warning_minutes, alert_minutes } = settings || {}
  if (!warning_minutes && !alert_minutes) return ''
  return minutes < warning_minutes
    ? 'warning'
    : minutes < alert_minutes
    ? 'alert'
    : 'text'
}
