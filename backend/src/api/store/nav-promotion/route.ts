import {
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import type { IPromotionModuleService } from "@medusajs/framework/types"

type CampaignLike = {
  starts_at?: Date | string | null
  ends_at?: Date | string | null
  name?: string | null
  description?: string | null
  campaign_identifier?: string | null
}

type PromotionLike = {
  id: string
  code?: string | null
  status?: string | null
  is_automatic?: boolean | null
  type?: string | null
  campaign?: CampaignLike | null
  application_method?: {
    type?: string | null
    target_type?: string | null
    value?: number | null
  } | null
  created_at?: Date | string | null
}

type NavPromotionResponse = {
  promotion: {
    id: string
    headline: string | null
    description: string | null
    code: string | null
    is_automatic: boolean
    starts_at: string | null
    ends_at: string | null
    application_method: {
      type: string | null
      target_type: string | null
      value: number | null
    } | null
  } | null
}

const DEFAULT_CAMPAIGN_IDENTIFIER = "navbar-banner"

const toOptionalISOString = (date?: Date | string | null): string | null => {
  if (!date) {
    return null
  }

  const parsed = date instanceof Date ? date : new Date(date)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

const isCampaignDisplayable = (
  campaign: CampaignLike | null,
  now: Date
): boolean => {
  if (!campaign) {
    return true
  }

  const startsAt = campaign.starts_at ? new Date(campaign.starts_at as any) : null
  const endsAt = campaign.ends_at ? new Date(campaign.ends_at as any) : null

  if (startsAt && Number.isNaN(startsAt.getTime())) {
    return true
  }

  if (endsAt && Number.isNaN(endsAt.getTime())) {
    return true
  }

  if (endsAt && endsAt < now) {
    return false
  }

  return true
}

const resolveCampaignIdentifier = (
  req: MedusaRequest
): string | undefined => {
  const fromQuery = typeof req.query?.campaign_identifier === "string"
    ? (req.query.campaign_identifier as string)
    : undefined

  return (
    fromQuery ||
    process.env.NAV_PROMOTION_CAMPAIGN_IDENTIFIER ||
    DEFAULT_CAMPAIGN_IDENTIFIER
  )
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse<NavPromotionResponse>
): Promise<void> {
  let promotionModuleService: IPromotionModuleService | undefined

  try {
    promotionModuleService = req.scope.resolve(Modules.PROMOTION)
  } catch (e) {
    res.json({ promotion: null })
    return
  }

  const campaignIdentifier = resolveCampaignIdentifier(req)

  const now = new Date()

  const fetchPromotions = async (filters: Record<string, unknown>) => {
    return promotionModuleService!.listPromotions(filters, {
      take: 20,
      relations: ["campaign", "application_method"],
    })
  }

  const baseFilters = {
    status: ["active"],
  }

  let promotions: PromotionLike[] = []

  if (campaignIdentifier) {
    promotions = (await fetchPromotions({
      ...baseFilters,
      campaign: {
        campaign_identifier: [campaignIdentifier],
      },
    })) as PromotionLike[]
  }

  if (!promotions.length) {
    promotions = (await fetchPromotions(baseFilters)) as PromotionLike[]
  }

  const activePromotion = promotions
    .filter((promotion) => isCampaignDisplayable(promotion.campaign ?? null, now))
    .sort((a, b) => {
      const aEnds = a.campaign?.ends_at
        ? new Date(a.campaign.ends_at as any)
        : null
      const bEnds = b.campaign?.ends_at
        ? new Date(b.campaign.ends_at as any)
        : null

      if (aEnds && bEnds) {
        return aEnds.getTime() - bEnds.getTime()
      }

      if (aEnds) {
        return -1
      }

      if (bEnds) {
        return 1
      }

      const aCreated = a.created_at ? new Date(a.created_at as any) : null
      const bCreated = b.created_at ? new Date(b.created_at as any) : null

      if (aCreated && bCreated) {
        return bCreated.getTime() - aCreated.getTime()
      }

      return 0
    })[0] as PromotionLike | undefined

  if (!activePromotion) {
    res.json({ promotion: null })
    return
  }

  const response: NavPromotionResponse = {
    promotion: {
      id: activePromotion.id,
      headline: activePromotion.campaign?.name ?? null,
      description: activePromotion.campaign?.description ?? null,
      code: activePromotion.is_automatic ? null : activePromotion.code ?? null,
      is_automatic: Boolean(activePromotion.is_automatic),
      starts_at: toOptionalISOString(activePromotion.campaign?.starts_at ?? null),
      ends_at: toOptionalISOString(activePromotion.campaign?.ends_at ?? null),
      application_method: activePromotion.application_method
        ? {
            type: activePromotion.application_method.type ?? null,
            target_type: activePromotion.application_method.target_type ?? null,
            value:
              typeof activePromotion.application_method.value === "number"
                ? activePromotion.application_method.value
                : null,
          }
        : null,
    },
  }

  res.json(response)
}
