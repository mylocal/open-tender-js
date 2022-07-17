export const isString = (str) => {
  return typeof str === 'string'
}

export const isObject = (obj) => {
  return typeof obj === 'object' && obj !== null
}

export const isEmpty = (obj) => {
  return (
    !obj || (obj.constructor === Object && Object.entries(obj).length === 0)
  )
}

export const isNum = (s) => /^\d+$/.test(s)

export const contains = (arr, values) => {
  return values.filter((i) => arr.includes(i)).length > 0
}

// https://gist.github.com/mathewbyrne/1280286
export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace('_', '-') // replace _ with -
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

export const stripTags = (s) =>
  s.replace(/(<([^>]+)>)/gi, '').replace('&amp;', '&')

export const serialize = (obj) => {
  var str = []
  for (var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]))
    }
  return str.join('&')
}

export const capitalize = (s) => {
  if (!s || !s.length) return ''
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

export const cleanPhone = (phone) => {
  if (!phone) return ''
  let p = phone.replace(/\D/g, '')
  if (p.length > 11) return phone
  p = p.length === 11 && p[0] === '1' ? p.slice(1, 11) : p
  p =
    p.length === 10 ? `${p.slice(0, 3)}-${p.slice(3, 6)}-${p.slice(6, 10)}` : p
  return p
}

export const makePhone = (phone) => {
  if (!phone) return ''
  let p = phone.replace(/\D/g, '')
  if (p.length > 6) {
    return `${p.slice(0, 3)}-${p.slice(3, 6)}-${p.slice(6, 10)}`
  } else if (p.length > 3) {
    return `${p.slice(0, 3)}-${p.slice(3, 6)}`
  }
  return p
}

export const validatePhone = (phone) => {
  if (!phone) return false
  return phone.match(/\d/g).length === 10
}

export const makeBirthDate = (birthDate) => {
  if (!birthDate) return ''
  let b = birthDate.replace(/\D/g, '')
  if (b.length > 4) {
    return `${b.slice(0, 2)}/${b.slice(2, 4)}/${b.slice(4, 8)}`
  } else if (b.length > 2) {
    return `${b.slice(0, 2)}/${b.slice(2, 4)}`
  }
  return b
}

export const slashesToDashes = (birthDate) => {
  if (!birthDate) return null
  const parts = birthDate.split('/')
  return `${parts[2] || ''}-${parts[0] || ''}-${parts[1] || ''}`
}

export const dashesToSlashes = (birthDate) => {
  if (!birthDate) return null
  const parts = birthDate.split('-')
  return `${parts[1] || ''}/${parts[2] || ''}/${parts[0] || ''}`
}

export const validateEmail = (email) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(email)
}

export const checkEmpty = (data) => {
  if (isEmpty(data)) return true
  return Object.values(data).filter((i) => !i).length > 0
}

export const checkGuestData = (data, email) => {
  const { first_name, last_name, phone } = data
  const guestData = { first_name, last_name, phone, email }
  const validPhone = validatePhone(phone) ? phone : null
  const guestIncomplete = checkEmpty({
    ...guestData,
    phone: validPhone,
  })
  return { guestData, guestIncomplete }
}

export const makeRandomNumberString = () =>
  Math.floor(Math.random() * 1000000000).toString()

export const getWidth = () => {
  return Math.max(
    document.body.scrollWidth,
    document.documentElement.scrollWidth,
    document.body.offsetWidth,
    document.documentElement.offsetWidth,
    document.documentElement.clientWidth
  )
}

export const getHeight = () => {
  return Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.documentElement.clientHeight
  )
}

export const makeImageUrl = (images, isMobile) => {
  return images.find(
    (i) => i.type === (isMobile ? 'SECONDARY_IMAGE' : 'FEATURED_IMAGE')
  ).url
}

export const makeSlides = (items, isMobile) => {
  if (!items || !items.length) return null
  return items.map((i) => ({
    ...i,
    imageUrl: makeImageUrl(i.images, isMobile),
  }))
}
