'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ApplySellerRequest,
  CreateDigitalAssetRequest,
  CreateDigitalAssetResponse,
  CreateOfferingUploadUrlRequest,
  CreateOfferingUploadUrlResponse,
  CreateSellerOfferingRequest,
  CreateSellerOfferingResponse,
  GetPublicOfferingBySlugResponse,
  GetPublicSellerByIdResponse,
  ListPublicOfferingsQuery,
  ListPublicOfferingsResponse,
  ListSellerOfferingsQuery,
  ListSellerOfferingsResponse,
  SellerProfile,
  SellerProfileResponse,
  SubmitSellerOfferingResponse,
  UpdateSellerOfferingRequest,
  UpdateSellerOfferingResponse,
} from '@kodira/types';
import { getKodiraApiClient } from '../kodiraClient';
import {
  mySellerOfferingsKey,
  mySellerProfileKey,
  publicOfferingBySlugKey,
  publicOfferingsKey,
  publicSellerByIdKey,
} from './queryKeys';

export function usePublicOfferingsQuery(query: ListPublicOfferingsQuery) {
  return useQuery<ListPublicOfferingsResponse>({
    queryKey: publicOfferingsKey(query),
    queryFn: async () => {
      const api = getKodiraApiClient();
      return api.marketplace.listPublicOfferings(query);
    },
  });
}

export function usePublicOfferingBySlugQuery(slug: string) {
  return useQuery<GetPublicOfferingBySlugResponse>({
    enabled: Boolean(slug),
    queryKey: publicOfferingBySlugKey(slug),
    queryFn: async () => {
      const api = getKodiraApiClient();
      return api.marketplace.getPublicOfferingBySlug(slug);
    },
  });
}

export function usePublicSellerByIdQuery(sellerId: string) {
  return useQuery<GetPublicSellerByIdResponse>({
    enabled: Boolean(sellerId),
    queryKey: publicSellerByIdKey(sellerId),
    queryFn: async () => {
      const api = getKodiraApiClient();
      return api.marketplace.getPublicSellerById(sellerId);
    },
  });
}

export function useMySellerProfileQuery(options?: { enabled?: boolean }) {
  return useQuery<SellerProfile | null>({
    enabled: options?.enabled ?? true,
    queryKey: mySellerProfileKey(),
    queryFn: async () => {
      const api = getKodiraApiClient();
      try {
        const res = await api.marketplace.getMySellerProfile();
        return res.seller;
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } } | undefined)?.response?.status;
        if (status === 404) return null;
        throw err;
      }
    },
  });
}

export function useApplySellerMutation() {
  const queryClient = useQueryClient();

  return useMutation<SellerProfileResponse, unknown, ApplySellerRequest>({
    mutationFn: async (body) => {
      const api = getKodiraApiClient();
      return api.marketplace.applySeller(body);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mySellerProfileKey() });
    },
  });
}

export function useMySellerOfferingsQuery(query: ListSellerOfferingsQuery, options?: { enabled?: boolean }) {
  return useQuery<ListSellerOfferingsResponse>({
    enabled: options?.enabled ?? true,
    queryKey: mySellerOfferingsKey(query),
    queryFn: async () => {
      const api = getKodiraApiClient();
      return api.marketplace.listMyOfferings(query);
    },
  });
}

export function useCreateSellerOfferingMutation() {
  const queryClient = useQueryClient();

  return useMutation<CreateSellerOfferingResponse, unknown, CreateSellerOfferingRequest>({
    mutationFn: async (body) => {
      const api = getKodiraApiClient();
      return api.marketplace.createOffering(body);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mySellerOfferingsKey({}) });
    },
  });
}

export function useUpdateSellerOfferingMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateSellerOfferingResponse,
    unknown,
    { offeringId: string; data: UpdateSellerOfferingRequest }
  >({
    mutationFn: async ({ offeringId, data }) => {
      const api = getKodiraApiClient();
      return api.marketplace.updateOffering(offeringId, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mySellerOfferingsKey({}) });
    },
  });
}

export function useSubmitSellerOfferingMutation() {
  const queryClient = useQueryClient();

  return useMutation<SubmitSellerOfferingResponse, unknown, { offeringId: string }>({
    mutationFn: async ({ offeringId }) => {
      const api = getKodiraApiClient();
      return api.marketplace.submitOffering(offeringId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mySellerOfferingsKey({}) });
    },
  });
}

export function usePauseSellerOfferingMutation() {
  const queryClient = useQueryClient();

  return useMutation<SubmitSellerOfferingResponse, unknown, { offeringId: string }>({
    mutationFn: async ({ offeringId }) => {
      const api = getKodiraApiClient();
      return api.marketplace.pauseOffering(offeringId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mySellerOfferingsKey({}) });
    },
  });
}

export function useUnpauseSellerOfferingMutation() {
  const queryClient = useQueryClient();

  return useMutation<SubmitSellerOfferingResponse, unknown, { offeringId: string }>({
    mutationFn: async ({ offeringId }) => {
      const api = getKodiraApiClient();
      return api.marketplace.unpauseOffering(offeringId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mySellerOfferingsKey({}) });
    },
  });
}

export function useCreateOfferingUploadUrlMutation() {
  return useMutation<
    CreateOfferingUploadUrlResponse,
    unknown,
    { offeringId: string; data: CreateOfferingUploadUrlRequest }
  >({
    mutationFn: async ({ offeringId, data }) => {
      const api = getKodiraApiClient();
      return api.marketplace.createOfferingUploadUrl(offeringId, data);
    },
  });
}

export function useCreateDigitalAssetMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    CreateDigitalAssetResponse,
    unknown,
    { offeringId: string; data: CreateDigitalAssetRequest }
  >({
    mutationFn: async ({ offeringId, data }) => {
      const api = getKodiraApiClient();
      return api.marketplace.createDigitalAsset(offeringId, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: mySellerOfferingsKey({}) });
    },
  });
}
