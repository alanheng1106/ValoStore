import { NextResponse } from 'next/server';
import { getOwnedItems } from '@/lib/valorant-api';
import { getSkins } from '@/lib/valorant-assets';
import { getRiotTokens } from '@/lib/session';

export async function GET() {
  try {
    const tokens = await getRiotTokens();
    if (!tokens) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const ownedEntitlements = await getOwnedItems();
    if (!ownedEntitlements || !ownedEntitlements.Entitlements) {
      return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }

    const ownedItemIDs = ownedEntitlements.Entitlements.map(e => e.ItemID);
    const allSkins = await getSkins();

    // Find owned skins (levels) and map them to their parent skin
    const ownedSkins = [];
    allSkins.forEach(skin => {
      // Check if user owns any level of this skin
      const ownedLevel = skin.levels.find(level => ownedItemIDs.includes(level.uuid));
      if (ownedLevel) {
        // Find which chromas the user owns
        const ownedChromas = skin.chromas.filter(chroma => ownedItemIDs.includes(chroma.uuid));
        
        ownedSkins.push({
          uuid: skin.uuid,
          name: skin.displayName,
          icon: skin.displayIcon || ownedLevel.displayIcon,
          weaponUuid: skin.weaponUuid,
          weaponName: skin.weaponName,
          tierUuid: skin.contentTierUuid,
          ownedChromas: ownedChromas.map(c => ({
            uuid: c.uuid,
            name: c.displayName,
            icon: c.displayIcon || c.swatch
          }))
        });
      }
    });

    // Group by weapon
    const groupedByWeapon = ownedSkins.reduce((acc, skin) => {
      if (!acc[skin.weaponName]) {
        acc[skin.weaponName] = {
          name: skin.weaponName,
          uuid: skin.weaponUuid,
          skins: []
        };
      }
      acc[skin.weaponName].skins.push(skin);
      return acc;
    }, {});

    // Convert object to array
    const inventory = Object.values(groupedByWeapon).sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Inventory API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
