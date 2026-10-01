'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, MapPin, BedDouble, Bath, Maximize, Eye, Layers } from 'lucide-react';
import { Property, PROPERTY_TYPE_LABELS } from '@/lib/types';
import { StatusBadge } from '@/components/status-badge';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function PropertyCard({ property, index = 0 }: { property: Property; index?: number }) {
  const { user } = useAuth();
  const [isFav, setIsFav] = useState(property.is_favorited ?? false);
  const [loading, setLoading] = useState(false);

  const mainImage = property.property_images?.find((img) => img.is_main) ?? property.property_images?.[0];
  const displayFields = property.display_fields ?? {};
  const isFieldVisible = (field: string) => displayFields[field] !== false;

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    setLoading(true);
    try {
      if (isFav) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('property_id', property.id);
        setIsFav(false);
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, property_id: property.id });
        setIsFav(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG').format(price);
  };

  return (
    <Link
      href={`/property/${property.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30"
    >
      <div className="relative img-zoom aspect-[4/3] overflow-hidden">
        {mainImage ? (
          <Image
            src={mainImage.image_url}
            alt={property.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <MapPin className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}

        <div className="absolute right-3 top-3 flex gap-2">
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground backdrop-blur">
            {PROPERTY_TYPE_LABELS[property.property_type]}
          </span>
          {property.is_featured && (
            <span className="rounded-full bg-gold px-3 py-1 text-xs font-semibold text-white backdrop-blur">
              مميز
            </span>
          )}
        </div>

        <div className="absolute left-3 top-3">
          <StatusBadge status={property.status} />
        </div>

        {user && (
          <button
            onClick={toggleFavorite}
            disabled={loading}
            className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur transition-all hover:bg-black/60"
            aria-label="إضافة للمفضلة"
          >
            <Heart
              className={cn('h-4 w-4 transition-all', isFav ? 'fill-red-500 text-red-500' : 'text-white')}
            />
          </button>
        )}

        {property.discount_percentage && property.discount_percentage > 0 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white backdrop-blur">
            خصم {property.discount_percentage}%
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-base font-bold text-foreground transition-colors group-hover:text-primary">
          {property.title}
        </h3>

        {isFieldVisible('location') && (property.city || property.location) && (
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">{property.city}{property.location ? ` - ${property.location}` : ''}</span>
          </p>
        )}
        {isFieldVisible('address') && property.address && (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{property.address}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {isFieldVisible('bedrooms') && property.bedrooms != null && (
            <span className="flex items-center gap-1">
              <BedDouble className="h-3.5 w-3.5" />
              {property.bedrooms} غرف
            </span>
          )}
          {isFieldVisible('bathrooms') && property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              {property.bathrooms} حمامات
            </span>
          )}
          {isFieldVisible('area') && property.area != null && (
            <span className="flex items-center gap-1">
              <Maximize className="h-3.5 w-3.5" />
              {property.area} م²
            </span>
          )}
          {isFieldVisible('floors') && property.floors != null && (
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              {property.floors} طوابق
            </span>
          )}
        </div>

        <div className="mt-auto pt-4 flex items-end justify-between">
          <div>
            {isFieldVisible('price') && <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-primary">{formatPrice(property.price)}</span>
              <span className="text-xs text-muted-foreground">جنيه</span>
            </div>}
            {isFieldVisible('price') && property.original_price && property.original_price > property.price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(property.original_price)} جنيه
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
            <Eye className="h-3.5 w-3.5" />
            عرض
          </span>
        </div>
      </div>
    </Link>
  );
}
