import { serviceTypeNamesMap } from './constants'
import {
  timezoneMap,
  makeOrderTimes,
  makeReadableDateStrFromIso,
  isoToDate,
  time24ToDate,
  formatDateStr,
  makeWeekday,
  fmtDate,
} from './datetimes'
import { capitalize } from './helpers'

export const displayPrice = (price) => {
  return parseFloat(price).toFixed(2)
}

export const makeDisplayPrice = (item) => {
  const sizeGroup =
    item.option_groups && item.option_groups.find((i) => i.is_size)
  if (sizeGroup) {
    const prices = sizeGroup.option_items.map(
      (i) => `$${displayPrice(i.price)}`
    )
    return prices.join(' / ')
  }
  const { totalPrice } = makeOrderItem(item)
  return totalPrice > 0 ? `$${displayPrice(totalPrice)}` : null
}

export const addCommas = (x, d) => {
  return x.toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export const formatQuantity = (n) => {
  return addCommas(parseFloat(n), 0)
}

export const formatDollars = (str, space = '', decimals = 2) => {
  const floatPrice = parseFloat(str)
  return floatPrice < 0
    ? `($${addCommas(Math.abs(floatPrice), decimals)})`
    : `$${addCommas(floatPrice, decimals)}${space}`
}

export const getItemOptions = (item) => {
  if (!item.groups || !item.groups.length) return []
  const options = item.groups
    .map((group) => group.options.filter((option) => option.quantity > 0))
    .reduce((arr, i) => [...arr, ...i], [])
  return options
}

export const makeModifierNames = (item) => {
  return getItemOptions(item)
    .map((option) => option.name)
    .join(', ')
}

export const convertStringToArray = (str) => {
  return str
    ? str
        .split(',')
        .map((i) => i.trim())
        .filter((i) => i.length)
    : []
}

export const makeOrderTypeFromParam = (param) => {
  switch (param) {
    case 'outpost':
      return ['OLO', 'PICKUP', true]
    case 'pickup':
      return ['OLO', 'PICKUP']
    case 'delivery':
      return ['OLO', 'DELIVERY']
    case 'catering':
      return ['CATERING', 'DELIVERY']
    case 'merch':
      return ['MERCH', 'DELIVERY']
    default:
      return null
  }
}

export const makeServiceTypeName = (
  serviceType,
  isCatering,
  isOutpost,
  outpostName
) => {
  let serviceTypeName = serviceTypeNamesMap[serviceType]
  if (isCatering) {
    serviceTypeName = `Catering ${serviceTypeName}`
  } else if (isOutpost) {
    serviceTypeName = `${outpostName || 'Outpost'} ${serviceTypeName}`
  }
  return serviceTypeName
}

export const makeOrderTypeName = (orderType, serviceType) => {
  return orderType === 'OLO'
    ? serviceTypeNamesMap[serviceType]
    : capitalize(orderType)
}

const makeOrderMsg = (
  tz,
  serviceType,
  requestedAt,
  firstTime,
  orderTime,
  waitTime
) => {
  if (!firstTime && !orderTime) return null
  let readableDate
  if (firstTime) {
    const seconds = firstTime.utc ? isoToDate(firstTime.utc).getSeconds() : 0
    const estimate = requestedAt !== 'asap' && seconds ? 'at about' : 'at'
    readableDate =
      requestedAt === 'asap' && firstTime.has_asap
        ? `in about ${waitTime} minutes`
        : makeReadableDateStrFromIso(firstTime.utc, tz, true)
            .replace('Today', 'today')
            .replace('Tomorrow', 'TOMORROW')
            .replace('@', estimate)
  } else {
    const orderTimes = makeOrderTimes(orderTime, tz)
    const { start_time, end_time } = orderTimes[0]
    const startTime = time24ToDate(start_time)
    const startTimeStr = formatDateStr(startTime, 'h:mma').toLowerCase()
    const endTime = time24ToDate(end_time)
    const endTimeStr = formatDateStr(endTime, 'h:mma').toLowerCase()
    const todayWeekday = makeWeekday()
    const weekday =
      orderTimes[0].weekday === todayWeekday
        ? ''
        : `${capitalize(orderTimes[0].weekday)}, ${fmtDate(
            orderTimes[0].date,
            'MMMM d'
          )} @ `
    readableDate =
      startTimeStr === endTimeStr
        ? `${weekday}${startTimeStr}`
        : `${weekday}${startTimeStr} to ${endTimeStr}`
  }
  const serviceTypeName = serviceTypeNamesMap[serviceType]
  const orderMsg = `The first available ${serviceTypeName.toLowerCase()} time is ${readableDate}`
  return orderMsg
}

export const makeNotAcceptingOrdersMsg = (serviceType) => {
  const serviceTypeName = serviceTypeNamesMap[serviceType]
  if (!serviceTypeName) {
    return 'This location is not currently accepting orders.'
  }
  return `This location is not currently accepting ${serviceTypeName.toLowerCase()} orders. Please try switching to a different order type.`
}

export const makeRevenueCenterMsg = (
  revenueCenter,
  serviceType,
  requestedAt,
  statusMessages
) => {
  const { first_times, order_times, wait_times } = revenueCenter.settings
  const tz = timezoneMap[revenueCenter.timezone]
  const st = serviceType === 'WALKIN' ? 'PICKUP' : serviceType
  const firstTime = first_times ? first_times[st] : null
  const orderTime = order_times ? order_times[st] : null
  const waitTime = wait_times ? wait_times[st] : null
  const tempClosed = revenueCenter.status === 'CLOSED_TEMPORARILY'
  const statusMsg = !tempClosed ? statusMessages[revenueCenter.status] : null
  const orderMsg =
    !statusMsg && (firstTime || (orderTime && orderTime.length))
      ? makeOrderMsg(
          tz,
          serviceType,
          requestedAt,
          firstTime,
          orderTime,
          waitTime
        )
      : null
  let message =
    orderMsg ||
    (statusMsg ? statusMsg.subtitle : makeNotAcceptingOrdersMsg(serviceType))
  let color = orderMsg ? 'success' : 'alert'
  if (tempClosed) {
    color = 'alert'
    message = message.charAt(0).toLowerCase() + message.substring(1)
    message = `This location is temporarily closed for technical or operational reasons. Please try back later today, otherwise ${message} if you want to place an order now.`
  }
  return { message, color }
}

const makeOrderItemGroups = (optionGroups, isEdit, soldOut = []) => {
  if (!optionGroups) return []
  const groups = optionGroups.map((g) => {
    const options = g.option_items.map((o) => {
      const isSoldOut = soldOut.includes(o.id)
      const quantity = isSoldOut
        ? 0
        : o.opt_is_default && !isEdit
        ? o.min_quantity || 1
        : 0
      const cals = o.nutritional_info
        ? parseInt(o.nutritional_info.calories)
        : null
      const option = {
        id: o.id,
        name: o.name,
        shortName: o.short_name,
        description: o.description,
        imageUrl: o.small_image_url,
        allergens: convertStringToArray(o.allergens),
        tags: convertStringToArray(o.tags),
        ingredients: o.ingredients,
        nutritionalInfo: o.nutritional_info,
        cals: isNaN(cals) ? null : cals,
        price: parseFloat(o.price),
        quantity: quantity,
        isDefault: o.opt_is_default,
        increment: o.increment,
        max: isSoldOut ? 0 : o.max_quantity,
        min: o.min_quantity,
        isSoldOut: isSoldOut,
        points: o.points || 0,
        isSnoozed: o.isSnoozed,
      }
      return option
    })
    const group = {
      id: g.id,
      name: g.name,
      description: g.description,
      imageUrl: g.small_image_url,
      included: g.included_options,
      max: g.max_options,
      min: g.min_options,
      isSize: !!g.is_size,
      options: options,
    }
    return group
  })
  return groups
}

export const calcPrices = (item) => {
  const groups = item.groups.map((g) => {
    let groupQuantity = 0
    const options = g.options.map((o) => {
      const includedRemaining = Math.max(g.included - groupQuantity, 0)
      const priceQuantity = Math.max(o.quantity - includedRemaining, 0)
      const option = {
        ...o,
        totalPrice: priceQuantity * o.price,
        totalPoints: priceQuantity * o.points,
        totalCals: o.cals ? o.quantity * o.cals : 0,
      }
      groupQuantity += o.quantity || 0
      return option
    })
    return { ...g, quantity: groupQuantity, options }
  })
  const optionsPrice = groups.reduce((t, g) => {
    return t + g.options.reduce((ot, o) => ot + o.totalPrice, 0.0)
  }, 0.0)
  const totalPrice = item.quantity * (item.price + optionsPrice)
  const optionsPoints = groups.reduce((t, g) => {
    return t + g.options.reduce((ot, o) => ot + o.totalPoints, 0)
  }, 0.0)
  const totalPoints = item.points
    ? item.quantity * (item.points + optionsPoints)
    : null
  const optionsCals = groups.reduce((t, g) => {
    return t + g.options.reduce((ot, o) => ot + o.totalCals, 0)
  }, 0.0)
  const totalCals =
    item.cals || item.cals === 0
      ? item.quantity * (item.cals + optionsCals)
      : null
  return { ...item, groups, totalPrice, totalPoints, totalCals }
}

export const makeOrderItem = (
  item,
  isEdit,
  soldOut = [],
  simpleItem,
  hasPoints = false
) => {
  const groups = makeOrderItemGroups(item.option_groups, isEdit, soldOut)
  const cals = item.nutritional_info
    ? parseInt(item.nutritional_info.calories)
    : null
  const orderItem = {
    id: item.id,
    name: item.name,
    shortName: item.short_name,
    category: item.category_name,
    description: item.description,
    imageUrl: item.large_image_url,
    slug: item.slug,
    allergens: convertStringToArray(item.allergens),
    tags: convertStringToArray(item.tags),
    ingredients: item.ingredients,
    nutritionalInfo: item.nutritional_info,
    cals: isNaN(cals) ? null : cals,
    groups: groups,
    quantity: item.min_quantity || 1 * item.increment,
    price: parseFloat(item.price),
    priceType: item.priceType,
    prices: item.prices,
    increment: item.increment,
    max: item.max_quantity,
    menu_id: item.menu_id,
    min: item.min_quantity,
    parent_available: item.parentAvailable,
    points: hasPoints ? item.points || null : null,
    section_id: item.section_id,
    upsellItems: item.upsell_items || [],
    similarItems: item.similar_items || [],
  }
  if (simpleItem) {
    const { cart_guest_id, customer_id, made_for, notes } = simpleItem
    if (cart_guest_id) orderItem.cart_guest_id = cart_guest_id
    if (customer_id) orderItem.customer_id = customer_id
    if (made_for) orderItem.madeFor = made_for
    if (notes) orderItem.notes = notes
  }
  const pricedItem = calcPrices(orderItem)
  return pricedItem
}

export const rehydrateOrderItem = (menuItem, simpleCartItem) => {
  const orderItem = makeOrderItem(menuItem, true, [], simpleCartItem)
  orderItem.quantity = simpleCartItem.quantity || 1
  if (simpleCartItem.groups && simpleCartItem.groups.length) {
    const groupsLookup = makeGroupsLookup(simpleCartItem)
    orderItem.groups.forEach((group) => {
      const simpleGroup = groupsLookup[group.id]
      if (simpleGroup) {
        group.options.forEach((option) => {
          const simpleOption = simpleGroup.options[option.id]
          option.quantity = simpleOption ? simpleOption.quantity : 0
        })
      }
    })
  }
  const pricedItem = calcPrices(orderItem)
  return pricedItem
}

export const rehydrateCart = (menuItems, simpleCartItems) => {
  let orderItems = []
  simpleCartItems.forEach((item) => {
    const menuItem = menuItems.find((i) => i.id === item.id)
    if (menuItem) {
      const orderItem = rehydrateOrderItem(menuItem, item)
      orderItems.push(orderItem)
    }
  })
  const cart = orderItems.map((i, index) => ({ ...i, index }))
  const cartCounts = calcCartCounts(cart)
  return { cart, cartCounts }
}

const rehydrateDetails = (details) => {
  return {
    cart_id: details.cart_id,
    eating_utensils: details.eating_utensils,
    notes: details.notes,
    person_count: details.person_count,
    serving_utensils: details.serving_utensils,
    tax_exempt_id: details.tax_exempt_id,
  }
}

const rehydrateCustomer = (customer) => {
  const newCustomer = {
    first_name: customer.first_name,
    last_name: customer.last_name,
    email: customer.email,
    phone: customer.phone,
    company: customer.company,
  }
  if (customer.customer_id) {
    newCustomer.customer_id = customer.customer_id
  }
  return newCustomer
}

const rehydrateAddress = (address) => {
  if (!address) return {}
  return {
    unit: address.unit,
    company: address.company,
    contact: address.contact,
    phone: address.phone,
  }
}

const rehydrateSurcharges = (surcharges) => {
  return surcharges
    .filter((i) => i.is_optional)
    .map((i) => ({ id: i.surcharge_id }))
}

const rehydrateDiscounts = (discounts) => {
  return discounts
    .filter((i) => !i.is_promo_code)
    .map((i) => ({ id: i.discount_id || i.id, ext_id: i.ext_id }))
}

const rehydratePromoCodes = (discounts) => {
  return discounts.filter((i) => i.is_promo_code).map((i) => i.name)
}

const rehydrateTenders = (tenders) => {
  // const giftCards = tenders.filter((i) => i.tender_type === 'GIFT_CARD')
  const other = tenders
    // .filter((i) => i.tender_type !== 'GIFT_CARD')
    .map((i) => {
      if (i.tender_type === 'CREDIT') {
        return { ...i, ...i.credit_card }
      } else if (i.tender_type === 'HOUSE_ACCOUNT') {
        return { ...i, ...i.house_account }
      } else {
        return i
      }
    })
  return other
}

export const rehydrateCheckoutForm = (order) => {
  const form = {
    details: rehydrateDetails(order.details),
    customer: rehydrateCustomer(order.customer),
    address: rehydrateAddress(order.address),
    surcharges: rehydrateSurcharges(order.surcharges),
    discounts: rehydrateDiscounts(order.discounts),
    promoCodes: rehydratePromoCodes(order.discounts),
    tenders: rehydrateTenders(order.tenders),
    tip: order.totals.tip,
  }
  return form
}

// group orders

export const makeGuestLookup = (cartGuests) => {
  return cartGuests.reduce((obj, i) => ({ ...obj, [i.cart_guest_id]: i }), {})
}

export const combineCarts = (cart, guestCart, cartOwner, cartGuests) => {
  const guestLookup = makeGuestLookup(cartGuests)
  const withGuestNames = guestCart
    .filter((i) => guestLookup[i.cart_guest_id])
    .map((i) => {
      const guest = guestLookup[i.cart_guest_id]
      return { ...i, madeFor: `${guest.first_name} ${guest.last_name}` }
    })
  const withOwnerName = cart.map((i) => {
    return {
      ...i,
      customer_id: cartOwner.customer_id,
      madeFor: `${cartOwner.first_name} ${cartOwner.last_name}`,
    }
  })
  return [...withOwnerName, ...withGuestNames]
}

// display items from past orders

export const makeItemImageUrl = (images) => {
  const imageMap = images
    .filter((i) => i.url)
    .reduce((obj, i) => ({ ...obj, [i.type]: i.url }), {})
  return (
    imageMap.SMALL_IMAGE || imageMap.LARGE_IMAGE || imageMap.APP_IMAGE || null
  )
}

export const makeItemSignature = (item) => {
  const optionIds = !item.groups
    ? []
    : item.groups
        .reduce((arr, group) => {
          const ids = group.options.map((o) => o.id)
          return [...arr, ...ids]
        }, [])
        .sort((a, b) => a - b)
  return [item.id, ...optionIds].join('.')
}

export const makeCartItemSignature = (item) => {
  const optionIds = !item.groups
    ? []
    : item.groups
        .reduce((arr, group) => {
          const ids = group.options
            .filter((o) => o.quantity > 0)
            .reduce((optionsArr, o) => {
              const optionArr = new Array(o.quantity)
              optionArr.fill(o.id)
              return [...optionsArr, ...optionArr]
            }, [])
          return [...arr, ...ids]
        }, [])
        .sort((a, b) => a - b)
  const itemIds = [item.id, ...optionIds].join('.')
  const signature = `${itemIds}.${item.madeFor}.${item.notes}`
  return signature
}

export const makeDisplayItemGroups = (optionGroups) => {
  if (!optionGroups || !optionGroups.length) return []
  return optionGroups.map((g) => {
    const options = g.options.map((o) => makeDisplayItem(o))
    return { ...g, options }
  })
}

export const makeDisplayItem = (item, isOption = false) => {
  const cals = item.nutritional_info
    ? parseInt(item.nutritional_info.calories)
    : null
  let displayItem = {
    id: item.id,
    name: item.name,
    shortDescription: item.short_description,
    description: item.description,
    imageUrl: makeItemImageUrl(item.images),
    allergens: item.allergens || [],
    tags: item.tags || [],
    nutritionalInfo: item.nutritional_info || null,
    cals: isNaN(cals) ? null : cals,
    groups: makeDisplayItemGroups(item.groups),
    quantity: item.quantity || 1,
    price: item.price !== undefined ? parseFloat(item.price) : null,
    totalPrice:
      item.price_total !== undefined ? parseFloat(item.price_total) : null,
  }
  if (!isOption) {
    const itemDetails = {
      madeFor: item.made_for,
      notes: item.notes,
      favoriteId: item.favorite_id,
      signature: makeItemSignature(item),
    }
    displayItem = { ...displayItem, ...itemDetails }
  }
  return displayItem
}

export const makeDisplayItems = (orders) => {
  const items = orders.reduce((items, order) => [...items, ...order.cart], [])
  return items.map((i) => makeDisplayItem(i))
}

export const makeUniqueDisplayItems = (orders) => {
  const items = makeDisplayItems(orders)
  let unique = [],
    signatures = []
  items.forEach((item) => {
    if (signatures.includes(item.signature)) return
    signatures.push(item.signature)
    unique.push(item)
  })
  return unique
}

export const makeFavoritesLookup = (favorites) => {
  if (!favorites) return {}
  return favorites
    .filter((i) => i.cart)
    .reduce(
      (obj, i) => ({ ...obj, [makeItemSignature(i.cart)]: i.favorite_id }),
      {}
    )
}

export const makeOrderAddress = (address) => {
  const { street, unit, city, state, postal_code } = address || {}
  return street
    ? `${street}${unit ? `, ${unit}` : ''}`
    : postal_code
    ? `${postal_code} ${city}, ${state}`
    : 'No address provided'
}

export const makeFullAddress = (address) => {
  const { street, city, state, postal_code } = address || {}
  return `${street ? `${street}, ` : ''}${city}, ${state} ${postal_code}`
}

export const calcCartCounts = (cart) => {
  return cart.reduce((obj, item) => {
    const newCount = (obj[item.id] || 0) + item.quantity
    return { ...obj, [item.id]: newCount }
  }, {})
}

export const addItem = (cart, item) => {
  if (typeof item.index === 'undefined') {
    const itemSignature = makeCartItemSignature(item)
    const itemSignatures = cart.map((i) => ({
      signature: makeCartItemSignature(i),
      ...i,
    }))
    const match = itemSignatures.find((i) => i.signature === itemSignature)
    if (match) {
      const quantity = item.quantity + match.quantity
      const newItem = { ...item, quantity }
      const updated = calcPrices(newItem)
      cart[match.index] = { ...updated, index: match.index }
    } else {
      cart.push({ ...item, index: cart.length })
    }
  } else {
    cart[item.index] = item
  }
  const cartCounts = calcCartCounts(cart)
  return { cart, cartCounts }
}

export const removeItem = (cart, index) => {
  cart.splice(index, 1)
  cart = cart.map((i, index) => ({ ...i, index: index }))
  const cartCounts = calcCartCounts(cart)
  return { cart, cartCounts }
}

export const incrementItem = (cart, index) => {
  const item = cart[index]
  if (item.max === 0 || item.quantity < item.max) {
    let newQuantity = item.quantity + item.increment
    newQuantity = item.max === 0 ? newQuantity : Math.min(item.max, newQuantity)
    const newItem = calcPrices({ ...item, quantity: newQuantity })
    cart[index] = newItem
  }
  const cartCounts = calcCartCounts(cart)
  return { cart, cartCounts }
}

export const decrementItem = (cart, index) => {
  const item = cart[index]
  const newQuantity = Math.max(item.quantity - item.increment, 0)
  if (newQuantity === 0 || newQuantity < item.min) {
    cart.splice(index, 1)
    cart = cart.map((i, index) => ({ ...i, index: index }))
  } else {
    const newItem = calcPrices({ ...item, quantity: newQuantity })
    cart[index] = newItem
  }
  const cartCounts = calcCartCounts(cart)
  return { cart, cartCounts }
}

export const makeSimpleCart = (cart) => {
  const simpleCart = cart.map((i) => {
    const groups = i.groups.map((g) => {
      const options = g.options
        .filter((o) => o.quantity !== 0)
        .map((o) => ({ id: o.id, quantity: o.quantity }))
      return { id: g.id, options: options }
    })
    return {
      id: i.id,
      quantity: i.quantity,
      groups: groups,
      made_for: i.madeFor || '',
      notes: i.notes || '',
    }
  })
  return simpleCart
}

/* cart validation */

// convert menu items to order items for validation but only include
// items that are already in the cart to save wasted effort
const makeItemLookup = (categories, itemIds) => {
  let itemLookup = {}
  categories.forEach((category) => {
    category.items.forEach((item) => {
      if (itemIds.includes(item.id)) {
        itemLookup[item.id] = makeOrderItem(item, true)
      }
    })
    category.children.forEach((child) => {
      child.items.forEach((item) => {
        if (itemIds.includes(item.id)) {
          itemLookup[item.id] = makeOrderItem(item, true)
        }
      })
    })
  })
  return itemLookup
}

const makeGroupsLookup = (item) => {
  return item.groups.reduce((grpObj, i) => {
    const options = i.options.reduce((optObj, o) => {
      optObj[o.id] = o
      return optObj
    }, {})
    grpObj[i.id] = { ...i, options }
    return grpObj
  }, {})
}

export const validateCart = (cart, categories, soldOut) => {
  const itemIds = cart.map((item) => item.id)
  const itemLookup = makeItemLookup(categories, itemIds)
  let errors = null,
    missingItems = [],
    invalidItems = []
  let newCart = cart.map((oldItem) => {
    const newItem = itemLookup[oldItem.id]
    if (!newItem || soldOut.includes(oldItem.id)) {
      missingItems.push(oldItem)
      return null
    }
    let missingGroups = [],
      invalidGroups = [],
      missingOptions = [],
      invalidOptions = []
    const newGroups = makeGroupsLookup(newItem)
    // check if any required groups for the new item are missing from the old item
    const newRequiredGroups = Object.values(newGroups).filter((i) => i.min > 0)
    const oldGroupIds = oldItem.groups.map((i) => i.id)
    missingGroups = newRequiredGroups.filter((i) => !oldGroupIds.includes(i.id))
    const newEmptyGroups = Object.values(newGroups)
      .filter((i) => {
        return i.min === 0 && !oldGroupIds.includes(i.id)
      })
      .map((i) => ({ ...i, options: Object.values(i.options) }))
    const updatedGroups = oldItem.groups.map((group) => {
      const optionCount = group.options.reduce((t, i) => (t += i.quantity), 0)
      const newGroup = newGroups[group.id]
      // check if option group is still part of the item
      if (!newGroup) {
        if (optionCount > 0) {
          invalidGroups.push(group)
          return group
        } else {
          return null
        }
      } else {
        const updatedOptions = group.options.map((option) => {
          const newOption = newGroup.options[option.id]
          // check to see if any OLD options aren't avaiilable on the current menu
          // or if any of the options are currently sold out
          if (
            !newOption ||
            (option.quantity > 0 && soldOut.includes(option.id))
          ) {
            missingOptions.push(option)
            return option
          } else {
            // check to see if option quantity is valid relative to option min & max
            // ignore the option increment setting for the time being
            if (
              (newOption.max && option.quantity > newOption.max) ||
              (newOption.min && option.quantity < newOption.min)
            ) {
              invalidOptions.push(option)
              return option
            } else {
              // update the old option price to the new option price
              const updatedOption = { ...option, price: newOption.price }
              return updatedOption
            }
          }
        })

        // check to see if the option count is greater than the max (if one exists)
        // or less than the min (if one exists)
        if (
          (newGroup.max && optionCount > newGroup.max) ||
          (newGroup.min && optionCount < newGroup.min)
        ) {
          invalidGroups.push(group)
        }
        const updatedGroup = { ...group, options: updatedOptions }
        return updatedGroup
      }
    })
    if (
      missingGroups.length ||
      invalidGroups.length ||
      missingOptions.length ||
      invalidOptions.length
    ) {
      const invalidItem = {
        ...oldItem,
        missingGroups,
        invalidGroups,
        missingOptions,
        invalidOptions,
      }
      invalidItems.push(invalidItem)
      return null
    } else {
      // check to see if this item's quantity is below the min or
      // above the max from the current menu
      if (
        (newItem.max && oldItem.quantity > newItem.max) ||
        (newItem.min && oldItem.quantity < newItem.min)
      ) {
        invalidItems.append(oldItem)
        return null
      }
      const nonNullGroups = updatedGroups.filter((i) => i !== null)
      const allNewGroups = [...nonNullGroups, ...newEmptyGroups]
      const updatedItem = {
        ...oldItem,
        groups: allNewGroups,
      }
      // update the old item price to the new item price
      updatedItem.price = newItem.price
      const pricedItem = calcPrices(updatedItem)
      return pricedItem
    }
  })
  newCart = newCart.filter((i) => i !== null)
  if (missingItems.length || invalidItems.length) {
    errors = { missingItems, invalidItems }
  }
  return { newCart, errors }
}

/* order submission */

export const getDefaultTip = (config) => {
  if (!config || !config.gratuity || !config.gratuity.has_tip) return null
  return config.gratuity.default ? config.gratuity.default.amount : null
}

export const prepareOrder = (data) => {
  data = data || {}
  const requestedIso = !data.requestedAt ? 'asap' : data.requestedAt
  const order = {
    revenue_center_id: data.revenueCenterId || null,
    service_type: data.serviceType || 'PICKUP',
    requested_at: requestedIso,
    cart: data.cart ? makeSimpleCart(data.cart) : [],
  }
  if (data.customer) order.customer = data.customer
  if (data.details) {
    const details = { ...data.details }
    // person_count must be submitted as integer
    if (details.person_count)
      details.person_count = parseInt(details.person_count) || null
    if (data.deviceType) details.device_type = data.deviceType
    order.details = { ...details }
  }
  if (data.surcharges) order.surcharges = data.surcharges
  if (data.discounts) order.discounts = data.discounts
  if (data.promoCodes) order.promo_codes = data.promoCodes
  if (data.points) order.points = data.points
  if (data.tip) order.tip = data.tip
  if (data.tenders) order.tenders = data.tenders
  if (data.address) order.address = data.address
  if (data.orderId) order.order_id = data.orderId
  if (data.cartId) order.cart_id = data.cartId
  return order
}

export const checkAmountRemaining = (total, tenders) => {
  if (!tenders) return total ? parseFloat(total) : 0.0
  let remaining =
    parseFloat(total) -
    tenders.reduce((t, i) => (t += parseFloat(i.amount)), 0.0)
  remaining = Math.round((remaining + Number.EPSILON) * 100) / 100
  return Object.is(remaining, -0) ? 0.0 : remaining
}
