import { formatDollars, formatQuantity } from './cart'
import { loyaltyType } from './constants'
import { getMinutesfromDate, time24ToMinutes } from './datetimes'

export const makeValidDeals = (
  deals,
  orderType,
  serviceType,
  revenueCenterId
) => {
  if (!deals || !deals.length) return []
  if (orderType) {
    deals = deals.filter((i) => !i.order_type || i.order_type === orderType)
  }
  if (serviceType) {
    deals = deals.filter(
      (i) => !i.service_type || i.service_type === serviceType
    )
  }
  if (revenueCenterId) {
    deals = deals.filter(
      (i) =>
        !i.revenue_centers.length ||
        i.revenue_centers
          .map((r) => r.revenue_center_id)
          .includes(revenueCenterId)
    )
  }
  const minutes = getMinutesfromDate(new Date())
  deals = deals.filter((i) => {
    if (!i.dayparts.length) return true
    const validDayparts = i.dayparts.filter((d) => {
      const start = time24ToMinutes(d.start_time)
      const end = time24ToMinutes(d.end_time)
      return start <= minutes <= end
    })
    return validDayparts.length > 0
  })
  return deals
}

export const makeStatus = (tiers, status, points) => {
  if (!tiers) return null
  const highest = tiers[tiers.length - 1].threshold
  const total = highest * 1.2
  const progress = Math.min((status.progress / total) * 100, 100)
  const progressTiers = tiers.map((i) => ({
    ...i,
    points,
    percentage: (i.threshold / total) * 100,
    color: `#${i.hex_code}`,
    value: !points
      ? `${formatDollars(i.threshold, '', 0)}`
      : `${formatQuantity(i.threshold)}`,
  }))
  const daysMsg = status.days === 7300 ? 'all-time' : `last ${status.days} days`
  const progressAmt = !points
    ? formatDollars(status.progress, '', 0)
    : formatQuantity(status.progress)
  const progressMsg = !points
    ? `${progressAmt} spent ${daysMsg}`
    : `${progressAmt} ${points.name.toLowerCase()} earned ${daysMsg}`
  return { progress, progressMsg, tiers: progressTiers }
}

export const makeProgress = (loyalty_type, spend, redemption) => {
  if (!spend || !redemption || !loyalty_type) return null
  const currentSpend = parseFloat(spend.current)
  const threshold = parseFloat(redemption.threshold)
  const progress =
    loyalty_type === loyaltyType.CREDIT
      ? parseInt((currentSpend / threshold) * 100)
      : null
  return progress
}
