import inside from 'point-in-polygon'
import { MAX_DISTANCE } from './constants'
import { isString } from './helpers'

// seee example Google Maps Place at bottom of file
const makeComponents = (components) => {
  return components.reduce((obj, i) => {
    return {
      ...obj,
      [i.types[0]]: { long_name: i.long_name, short_name: i.short_name },
    }
  }, {})
}

export const makeAddress = (place) => {
  const { address_components, formatted_address, geometry } = place
  const components = makeComponents(address_components)
  const {
    street_number,
    route,
    locality: city,
    administrative_area_level_1: state,
    postal_code: postalCode,
  } = components
  const streetNumber = street_number ? street_number.short_name : ''
  const street = route ? route.long_name : ''
  return {
    street: `${streetNumber} ${street}`.trim(),
    city: city ? city.long_name : '',
    state: state ? state.short_name : '',
    postal_code: postalCode ? postalCode.short_name : '',
    lat: geometry.location.lat() || null,
    lng: geometry.location.lng() || null,
    formatted_address,
  }
}

export const RADIUS_MILES = 3959 // radius of the earth in miles
export const RADIUS_KM = 6371 // radius of the earth in kilometers

// https://stackoverflow.com/questions/18883601/function-to-calculate-distance-between-two-coordinates
export const getDistance = (pointA, pointB, inMiles = true) => {
  const { lat: lat1, lng: lng1 } = pointA
  const { lat: lat2, lng: lng2 } = pointB
  const R = inMiles ? RADIUS_MILES : RADIUS_KM
  const dLat = deg2rad(lat2 - lat1) // see deg2rad below
  const dLng = deg2rad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c
  return d
}

const deg2rad = (deg) => {
  return deg * (Math.PI / 180)
}

export const inZone = (address, polygon) => {
  const point = [address.lat, address.lng]
  return inside(point, polygon)
}

export const addDistance = (revenueCenters, address) => {
  if (!address) return revenueCenters
  const withDistance = revenueCenters.map((i) => {
    const latLng = i.address.lat
      ? { lat: i.address.lat, lng: i.address.lng }
      : null
    i.distance = latLng ? getDistance(address, latLng) : 1000
    const { coordinates, priority } = i.delivery_zone
    i.inZone = coordinates ? inZone(address, coordinates) : false
    i.priority = priority
    return i
  })
  return withDistance
}

export const sortRevenueCenters = (revenueCenters, isDelivery = false) => {
  if (!isDelivery) {
    return [...revenueCenters].sort((a, b) => a.distance - b.distance)
  }
  const inZoneWithPriority = revenueCenters
    .filter((i) => i.inZone && i.priority)
    .sort((a, b) => a.priority - b.priority)
  const inZoneWithoutPriority = revenueCenters
    .filter((i) => i.inZone && !i.priority)
    .sort((a, b) => a.distance - b.distance)
  const outOfZone = revenueCenters
    .filter((i) => !i.inZone)
    .sort((a, b) => a.distance - b.distance)
  return [...inZoneWithPriority, ...inZoneWithoutPriority, ...outOfZone]
}

export const calcMinDistance = (revenueCenters, maxDistance = MAX_DISTANCE) => {
  const withDistance = revenueCenters
    .filter((i) => i.distance !== null)
    .map((i) => i.distance)
  return withDistance ? Math.min(...withDistance) : maxDistance
}

export const makePickupRevenueCenters = (
  revenueCenters,
  maxDistance = MAX_DISTANCE
) => {
  const hasPickup = revenueCenters
    .filter((i) => i.settings.service_types.includes('PICKUP'))
    .filter((i) => i.distance === null || i.distance < maxDistance)
  return sortRevenueCenters(hasPickup)
}

export const makeDeliveryRevenueCenters = (revenueCenters) => {
  const hasDelivery = revenueCenters.filter((i) =>
    i.settings.service_types.includes('DELIVERY')
  )
  const sorted = sortRevenueCenters(hasDelivery, true)
  return sorted.filter((i) => i.inZone)
}

export const makePickupMesssaging = (
  address,
  geoLatLng,
  count,
  minDistance,
  maxDistance = MAX_DISTANCE,
  messages = LOCATIONS_MESSAGES
) => {
  if (address) {
    if (minDistance >= maxDistance) {
      return messages.PICKUP.addressFar
    } else {
      return {
        title: `${count} ${messages.PICKUP.address.title}`,
        msg: messages.PICKUP.address.msg,
      }
    }
  } else if (geoLatLng) {
    if (minDistance >= maxDistance) {
      return messages.PICKUP.geoFar
    } else {
      return {
        title: `${count} ${messages.PICKUP.geo.title}`,
        msg: messages.PICKUP.geo.msg,
      }
    }
  } else {
    return messages.PICKUP.default
  }
}

export const makeDeliveryMesssaging = (
  address,
  count,
  messages = LOCATIONS_MESSAGES
) => {
  if (!address) {
    return messages.DELIVERY.default
  } else if (!address.street) {
    return messages.DELIVERY.noStreet
  } else {
    if (count) {
      const locationMsg = count > 1 ? 'locations deliver' : 'location delivers'
      return {
        title: messages.DELIVERY.hasDelivery.title,
        msg: `${count} ${locationMsg} to your address.`,
        error: null,
      }
    } else {
      return messages.DELIVERY.noDelivery
    }
  }
}

export const LOCATIONS_MESSAGES = {
  PICKUP: {
    default: {
      title: 'Please choose a location',
      msg: 'Or enter a zip code to find the location nearest you.',
    },
    address: {
      title: 'locations near you',
      msg: 'Please choose a location below.',
    },
    addressFar: {
      title: "Looks like we don't have any locations in your area",
      msg:
        'Sorry about that. Please enter a different address or head back and choose a different order type.',
    },
    geo: {
      title: 'locations in your area',
      msg: 'Please enter a zip code or address for a more accurate result.',
    },
    geoFar: {
      title: "Looks like we don't have any locations in your area",
      msg:
        'Please enter a zip code or address if you live in a different area.',
    },
  },
  DELIVERY: {
    default: {
      title: "Let's find the nearest location",
      msg: 'Please enter your address below.',
      error: null,
    },
    noStreet: {
      title: 'Please enter a street address',
      msg: '',
      error:
        'A full address with street number is required for delivery orders.',
    },
    hasDelivery: {
      title: 'Delivery is available!',
      msg: 'Please choose a location below.',
      error: null,
    },
    noDelivery: {
      title: "Delivery isn't available in your area",
      msg:
        "We're really sorry about that. Please enter a different address or head back and start a pickup order.",
      error: null,
    },
  },
}

export const renameLocation = (str, names) => {
  if (!isString(str)) return str
  const [singular, plural] = names
  return str
    .replace('1 locations', '1 location')
    .replace('locations', plural)
    .replace('location', singular)
    .replace(' a a', ' an a')
    .replace(' a e', ' an e')
    .replace(' a i', ' an i')
    .replace(' a o', ' an o')
    .replace(' a u', ' an u')
}

const makeMapStyles = ({
  labelColor,
  roadColor,
  featureColor,
  waterColor,
  backgroundColor,
}) => [
  {
    featureType: 'transit',
    elementType: 'all',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'administrative',
    elementType: 'labels.text.fill',
    stylers: [{ visibility: 'off' }],
    // stylers: [{ color: labelColor }]
  },
  {
    featureType: 'administrative',
    elementType: 'labels.text.stroke',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ visibility: 'simplified' }, { color: roadColor }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: labelColor }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.stroke',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: featureColor }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: waterColor }],
  },
  {
    featureType: 'water',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: backgroundColor }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: backgroundColor }],
  },
  {
    featureType: 'landscape',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
]

export default makeMapStyles

/* example Google Maps Place

{
  "address_components": [
    {
      "long_name": "150",
      "short_name": "150",
      "types": [
        "street_number"
      ]
    },
    {
      "long_name": "East Huron Street",
      "short_name": "E Huron St",
      "types": [
        "route"
      ]
    },
    {
      "long_name": "Streeterville",
      "short_name": "Streeterville",
      "types": [
        "neighborhood",
        "political"
      ]
    },
    {
      "long_name": "Chicago",
      "short_name": "Chicago",
      "types": [
        "locality",
        "political"
      ]
    },
    {
      "long_name": "Cook County",
      "short_name": "Cook County",
      "types": [
        "administrative_area_level_2",
        "political"
      ]
    },
    {
      "long_name": "Illinois",
      "short_name": "IL",
      "types": [
        "administrative_area_level_1",
        "political"
      ]
    },
    {
      "long_name": "United States",
      "short_name": "US",
      "types": [
        "country",
        "political"
      ]
    },
    {
      "long_name": "60611",
      "short_name": "60611",
      "types": [
        "postal_code"
      ]
    }
  ],
  "formatted_address": "150 E Huron St, Chicago, IL 60611, USA",
  "geometry": {
    "location": {
      "lat": 41.8950882,
      "lng": -87.62325709999999
    },
    "viewport": {
      "south": 41.8936716697085,
      "west": -87.62463608029151,
      "north": 41.8963696302915,
      "east": -87.62193811970849
    }
  },
  "place_id": "ChIJK3otrVTTD4gRNsbgQbBVYBw",
  "html_attributions": []
}

*/
