export const profileFields = [
  'customer_id',
  'first_name',
  'last_name',
  'email',
  'phone',
  'company',
]

export const makeCustomerProfile = (customer) => {
  return profileFields.reduce(
    (obj, field) => ({ ...obj, [field]: customer[field] }),
    {}
  )
}
