import { parseISO } from 'date-fns'

export const profileFields = [
  'customer_id',
  'first_name',
  'last_name',
  'email',
  'phone',
  'company',
  'accepts_marketing',
  'order_notifications',
]

export const makeCustomerProfile = (customer) => {
  return profileFields.reduce(
    (obj, field) => ({ ...obj, [field]: customer[field] }),
    {}
  )
}

export const getLastOrder = (orders) => {
  if (!orders || !orders.length) return null
  const withCreated = orders
    .filter((i) => i.order_type !== 'MERCH')
    .map((i) => ({ ...i, createdAt: parseISO(i.created_at) }))
    .sort((a, b) => a.createdAt - b.createdAt)
    .reverse()
  return withCreated[0]
}
