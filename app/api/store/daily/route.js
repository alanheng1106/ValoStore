import { NextResponse } from 'next/server';
import { getStorefront } from '@/lib/valorant-api';
import { getSkins, getContentTiers } from '@/lib/valorant-assets';
import { getRiotTokens } from '@/lib/session';
import { getStoreCache, setStoreCache } from '@/lib/cache';

export async function GET() {
  try {
    const tokens = await getRiotTokens();
    if (!tokens) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const cachedStore = getStoreCache(tokens.puuid);
    if (cachedStore) {
      return NextResponse.json(cachedStore);
    }

    const storefront = await getStorefront();
    if (!storefront) {
      return NextResponse.json({ error: 'Failed to fetch storefront' }, { status: 500 });
    }

    // Process daily offers
    const offers = storefront.SkinsPanelLayout.SingleItemOffers;
    const dailyRemaining = storefront.SkinsPanelLayout.SingleItemOffersRemainingDurationInSeconds;
    
    // Get asset data
    const allSkins = await getSkins();
    const contentTiers = await getContentTiers();
    
    const enrichedOffers = offers.map(offerUuid => {
      const skinInfo = allSkins.find(s => s.levels[0].uuid === offerUuid);
      let tierColor = 'gray';
      let tierIcon = null;
      
      if (skinInfo && contentTiers) {
        const tierInfo = contentTiers.find(t => t.uuid === skinInfo.contentTierUuid);
        if (tierInfo) {
          tierColor = `#${tierInfo.highlightColor}`;
          tierIcon = tierInfo.displayIcon;
        }
      }
      
      const priceInfo = storefront.SkinsPanelLayout.SingleItemStoreOffers.find(o => o.OfferID === offerUuid);
      const cost = priceInfo ? Object.values(priceInfo.Cost)[0] : 0;

      return {
        uuid: offerUuid,
        name: skinInfo ? skinInfo.displayName : 'Unknown Skin',
        icon: skinInfo && skinInfo.displayIcon ? skinInfo.displayIcon : null,
        cost: cost,
        tierColor,
        tierIcon
      };
    });

    // Process Featured Bundle
    let featuredBundleData = null;
    if (storefront.FeaturedBundle && storefront.FeaturedBundle.Bundles && storefront.FeaturedBundle.Bundles.length > 0) {
      const bundle = storefront.FeaturedBundle.Bundles[0];
      const bundleId = bundle.DataAssetID;
      
      try {
        const bundleRes = await fetch(`https://valorant-api.com/v1/bundles/${bundleId}`);
        const bundleJson = await bundleRes.json();
        const bundleMeta = bundleJson.data;

        let totalPrice = 0;
        if (bundle.Items) {
          bundle.Items.forEach(item => {
            totalPrice += item.DiscountedPrice || item.BasePrice || 0;
          });
        }

        featuredBundleData = {
          uuid: bundleId,
          name: bundleMeta ? bundleMeta.displayName : 'Featured Bundle',
          icon: bundleMeta ? (bundleMeta.displayIcon2 || bundleMeta.displayIcon) : null,
          cost: totalPrice,
          refreshIn: bundle.DurationRemainingInSeconds
        };
      } catch (err) {
        console.error('Failed to fetch bundle meta:', err);
      }
    }

    const storeData = {
      featuredBundle: featuredBundleData,
      dailyOffers: enrichedOffers,
      refreshIn: dailyRemaining
    };

    const expiresAt = Date.now() + (dailyRemaining * 1000);
    setStoreCache(tokens.puuid, storeData, expiresAt);

    return NextResponse.json(storeData);
  } catch (error) {
    console.error('Store API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
