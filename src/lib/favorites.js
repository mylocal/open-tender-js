import { convertStringToArray, makeDisplayPrice } from './cart'

export const prepareMenuItem = (
  item,
  allergenAlerts = [],
  soldOut = [],
  displaySettings = {},
  cartCounts = {},
  isBrowser = false
) => {
  const {
    menuImages: showImage,
    calories: showCals,
    tags: showTags,
    allergens: showAllergens,
    itemsTwoPerRowMobile: showTwo,
    quickAdd = true,
    quickAddMobile = true,
  } = displaySettings
  const isSoldOut = soldOut.includes(item.id)
  const cartCount = cartCounts[item.id] || 0
  const smallImg =
    item.small_image_url || item.app_image_url || item.big_image_url
  const imageUrl = showImage ? smallImg : null
  const price = makeDisplayPrice(item)
  // const points = pointsProgram && item.points
  const cals =
    showCals && item.nutritional_info
      ? parseInt(item.nutritional_info.calories) || null
      : null
  const tags = showTags ? convertStringToArray(item.tags) : []
  const allergens = showAllergens ? convertStringToArray(item.allergens) : []
  const contains = allergens.length
    ? allergens.filter((allergen) => allergenAlerts.includes(allergen))
    : []
  const allergenAlert = contains.length ? `${contains.join(', ')}` : null
  const hasQuickAdd = isBrowser ? quickAdd : quickAddMobile
  const showQuickAdd = hasQuickAdd && !isSoldOut

  return {
    imageUrl,
    price,
    cals,
    tags,
    allergens,
    allergenAlert,
    isSoldOut,
    showQuickAdd,
    cartCount,
    showTwo,
  }
}

export const makeMenuItemLookup = (categories) => {
  const cats = categories.reduce((arr, cat) => {
    return [...arr, cat, ...(cat.children || [])]
  }, [])
  return cats.reduce((obj, category) => {
    const items = category.items.reduce((o, i) => ({ ...o, [i.id]: i }), {})
    return { ...obj, ...items }
  }, {})
}

export const makeMenuGroupsLookup = (menuItem) => {
  if (!menuItem.option_groups) return {}
  return menuItem.option_groups.reduce((grpObj, i) => {
    const options = i.option_items.reduce((optObj, o) => {
      optObj[o.id] = o
      return optObj
    }, {})
    grpObj[i.id] = { ...i, options }
    return grpObj
  }, {})
}

const validateFavorite = (item, menuItem, soldOut) => {
  const groupsLookup = makeMenuGroupsLookup(menuItem)
  let missingGroups = [],
    missingOptions = []
  item.groups.forEach((group) => {
    const menuItemGroup = groupsLookup[group.id]
    if (menuItemGroup) {
      group.options.forEach((option) => {
        const menuItemOption = menuItemGroup.options[option.id]
        if (!menuItemOption || soldOut.includes(option.id)) {
          missingOptions.push(option)
        }
      })
    } else {
      missingGroups.push(group)
    }
  })
  return missingGroups.length || missingOptions.length ? false : true
}

export const makeFavorites = (favorites, itemLookup, soldOut) => {
  return favorites.reduce((arr, favorite) => {
    const menuItem = itemLookup[favorite.item.id]
    if (!menuItem) return arr
    const isValid = validateFavorite(favorite.item, menuItem, soldOut)
    return isValid ? [...arr, { ...menuItem, favorite }] : arr
  }, [])
}

export const makeRecents = (recents, itemLookup, soldOut) => {
  return recents.reduce((arr, item) => {
    const menuItem = itemLookup[item.id]
    if (!menuItem) return arr
    const isValid = validateFavorite(item, menuItem, soldOut)
    if (!isValid) return arr
    const favorite = { item }
    return isValid
      ? [
          ...arr,
          {
            ...menuItem,
            favorite: { item: { ...favorite.item, quantity: 1 } },
          },
        ]
      : arr
  }, [])
}
