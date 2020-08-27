export const processError = (msg) => {
  if (!msg) return errMessages.unknown
  if (msg.includes('is a required property')) {
    return errMessages.requiredField
  } else if (msg.includes("'' is too short")) {
    return errMessages.requiredField
  } else if (msg.includes("not a 'email'")) {
    return errMessages.invalidEmail
  } else if (msg.includes("not a 'phone'")) {
    return errMessages.invalidPhone
  } else if (msg.includes("not a 'optional-phone'")) {
    return errMessages.invalidPhone
  } else if (msg.includes('invalid token')) {
    return errMessages.invalidToken
  } else if (msg.includes("not a 'user-password'")) {
    return errMessages.invalidPassword
  }
  return msg
}

export const handleFormErrors = (params) => {
  return Object.entries(params).reduce((obj, error) => {
    const [field, msg] = error
    const message = processError(msg)
    return { ...obj, [field.replace('$.', '')]: message }
  }, {})
}

export const makeFormErrors = (error) => {
  let errors = {}
  if (error.params) {
    errors = handleFormErrors(error.params)
    errors.form = error.detail
  } else {
    errors.form = error.detail || error.message
  }
  return errors
}

export const handleCheckoutErrors = (errors, asMessages = true) => {
  const { detail, params, message } = errors
  if (!params) return { form: detail || message }
  const errObj = Object.entries(params).reduce(
    (obj, error) => {
      const [key, value] = error
      const err = asMessages ? value.message : value
      let [, entity, index, field] = key.split('.')
      const existingEntity = obj[entity] || {}
      if (!index) {
        return { ...obj, [entity]: err }
      } else if (!field) {
        const newEntity = { ...existingEntity, [index]: err }
        return { ...obj, [entity]: newEntity }
      } else {
        if (existingEntity) {
          const existingIndex = existingEntity[index] || {}
          const newIndex = { ...existingIndex, [field]: err }
          const newEntity = { ...existingEntity, [index]: newIndex }
          return { ...obj, [entity]: newEntity }
        } else {
          return { ...obj, [entity]: { [index]: { [field]: err } } }
        }
      }
      // const newEntity = obj[entity]
      //   ? { ...obj[entity], [index]: err }
      //   : index
      //   ? { [index]: err }
      //   : err
      // return { ...obj, [entity]: newEntity }
    },
    { form: 'There are one or more errors below' }
  )
  return errObj
}

export const errMessages = {
  unknown: 'Unknown error. Please contact Open Tender support.',
  forbidden:
    'Your account does not have access to this page. Please contact your brand admin to request access.',
  expiredToken:
    'Reset token has expired. Please head back to the login form and try again.',
  notAllowed: "This operation isn't allowed for this entity",
  duplicates:
    'One or more fields are already in use. Please choose different values.',
  errorsBelow: 'There are one or more errors below.',
  emptyField: 'This field cannot be empty',
  invalidAmount: 'Invalid amount',
  invalidEmail: 'Invalid email address',
  invalidEmails: 'One or more email addresses are invaiid',
  notInteger: 'Must be an integer',
  positiveInteger: 'Must be a positive integer',
  invalidTime: 'Enter in HH:MM AM|PM format (e.g. 9:40 AM)',
  invalidDate: 'Enter in YYYY-MM-DD format or leave blank',
  invalidNumber: 'Enter as a number with or without decimals',
  invalidHex: 'Enter as a hexidecimal color code',
  invalidZip: 'Enter a valid 5 digit zip code',
  invalidPhone: 'Invalid phone number',
  invalidPassword:
    'Invalid password. Passwords must be at least 8 characters and include only letters and numbers and any of these special characters: !@#$%^&_-+=<>.',
  invalidToken:
    'Password reset token is invalid or expired. Please resubmit your password reset request via the login form.',
  requiredField: 'This field is required',
  invalidFilename: 'Invalid filename. Please rename the file and try again.',
  notExist: 'The requested entity does not exist.',
  serverError: 'Unknown error. Please contact Open Tender support.',
  invalidHours: 'One or more invalid times submitted. Please see below.',
  revenueCenterClosed:
    'This location is closed or otherwise not able to accept orders at the selected time. Please try changing your order time.',
  serviceTypeNotAvailable:
    'This location does not offer the selected service type at this time. Please switch to another service type.',
  notInZone:
    'Selected address not in the delivery zone for this revenue center',
  missingAddress: 'An address is required for delivery orders. Please add one.',
  orderNotFound:
    "Sorry, but we couldn't find an order matching that ID. Please try again.",
  distanceSurcharge:
    "Distance-based surcharges can't be applied to orders with requested times in the past. Please adjust your requested delivery time.",
  missingAddressDeliveryZone:
    "Please add an address for this revenue center or the revenue center's parent store before setting a delivery zone",
}
