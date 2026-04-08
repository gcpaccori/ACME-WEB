import { supabase } from '../../integrations/supabase/client';

export interface AdminMessageOption {
  id: string;
  label: string;
}

export interface ConversationOverviewRecord {
  id: string;
  order_id: string;
  order_code: string;
  branch_label: string;
  conversation_type: string;
  status: string;
  created_at: string;
  created_by_label: string;
  participants_summary: string;
  messages_count: number;
  unread_count: number;
  last_message_preview: string;
  last_message_at: string;
}

export interface NotificationOverviewRecord {
  id: string;
  user_id: string;
  user_label: string;
  channel: string;
  type: string;
  title: string;
  body: string;
  entity_type: string;
  entity_id: string;
  status: string;
  sent_at: string;
  read_at: string;
  created_at: string;
}

export interface ConversationParticipantRecord {
  id: string;
  user_id: string;
  user_label: string;
  participant_role: string;
  joined_at: string;
  left_at: string;
}

export interface ConversationMessageRecord {
  id: string;
  sender_user_id: string;
  sender_label: string;
  message_type: string;
  body: string;
  file_url: string;
  is_system: boolean;
  created_at: string;
  read_count: number;
  readers_label: string;
}

export interface ConversationDetail {
  id: string;
  order_id: string;
  order_code: string;
  branch_label: string;
  conversation_type: string;
  status: string;
  created_at: string;
  created_by: string;
  created_by_label: string;
  participants: ConversationParticipantRecord[];
  messages: ConversationMessageRecord[];
  available_participants: AdminMessageOption[];
  order_options: AdminMessageOption[];
}

export interface MessagesOverview {
  conversations: ConversationOverviewRecord[];
  notifications: NotificationOverviewRecord[];
  participant_options: AdminMessageOption[];
  order_options: AdminMessageOption[];
}

export interface ConversationCreateForm {
  order_id: string;
  conversation_type: string;
  status: string;
  participant_user_id: string;
  participant_role: string;
  initial_message: string;
}

export interface ConversationStatusForm {
  status: string;
}

export interface ConversationParticipantForm {
  user_id: string;
  participant_role: string;
}

export interface ConversationMessageForm {
  message_type: string;
  body: string;
  file_url: string;
  is_system: boolean;
}

function stringOrEmpty(value: unknown) {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function nullableString(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

async function logAdminSideEffects(params: {
  actorUserId: string;
  merchantId?: string;
  branchId?: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValues?: unknown;
  newValues?: unknown;
  orderId?: string;
  eventName: string;
}) {
  const now = new Date().toISOString();
  await Promise.allSettled([
    supabase.from('audit_logs').insert({
      actor_user_id: params.actorUserId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      action: params.action,
      old_values_json: params.oldValues ?? null,
      new_values_json: params.newValues ?? null,
      ip_address: null,
      user_agent: null,
      created_at: now,
    }),
    params.merchantId
      ? supabase.from('merchant_audit_logs').insert({
          merchant_id: params.merchantId,
          branch_id: params.branchId ?? null,
          user_id: params.actorUserId,
          entity_type: params.entityType,
          entity_id: params.entityId,
          action: params.action,
          metadata_json: params.newValues ?? null,
          created_at: now,
        })
      : Promise.resolve(),
    supabase.from('analytics_events').insert({
      user_id: params.actorUserId,
      order_id: params.orderId ?? null,
      event_name: params.eventName,
      properties_json: {
        entity_type: params.entityType,
        entity_id: params.entityId,
        action: params.action,
      },
      created_at: now,
    }),
  ]);
}

async function fetchMessagingLookups(merchantId: string) {
  const [branchResult, orderResult, staffResult] = await Promise.all([
    supabase.from('merchant_branches').select('id, name').eq('merchant_id', merchantId).order('name', { ascending: true }),
    supabase
      .from('orders')
      .select('id, order_code, branch_id, customer_id, current_driver_id')
      .eq('merchant_id', merchantId)
      .order('placed_at', { ascending: false })
      .limit(200),
    supabase.from('merchant_staff').select('user_id').eq('merchant_id', merchantId),
  ]);

  if (branchResult.error) return { data: null, error: branchResult.error };
  if (orderResult.error) return { data: null, error: orderResult.error };
  if (staffResult.error) return { data: null, error: staffResult.error };

  const branchRows = (branchResult.data ?? []) as any[];
  const orderRows = (orderResult.data ?? []) as any[];
  const staffRows = (staffResult.data ?? []) as any[];

  const customerIds = uniqueStrings(orderRows.map((row) => stringOrEmpty(row.customer_id)));
  const driverIds = uniqueStrings(orderRows.map((row) => stringOrEmpty(row.current_driver_id)));

  const customersResult =
    customerIds.length > 0
      ? await supabase.from('customers').select('id, user_id').in('id', customerIds)
      : ({ data: [], error: null } as any);

  if (customersResult.error) return { data: null, error: customersResult.error };

  const customerRows = (customersResult.data ?? []) as any[];
  const profileUserIds = uniqueStrings([
    ...staffRows.map((row) => stringOrEmpty(row.user_id)),
    ...customerRows.map((row) => stringOrEmpty(row.user_id)),
    ...driverIds,
  ]);

  const profilesResult =
    profileUserIds.length > 0
      ? await supabase.from('profiles').select('user_id, full_name, email').in('user_id', profileUserIds)
      : ({ data: [], error: null } as any);

  if (profilesResult.error) return { data: null, error: profilesResult.error };

  const profileRows = (profilesResult.data ?? []) as any[];
  const profileMap = new Map<string, any>(profileRows.map((row) => [stringOrEmpty(row.user_id), row]));
  const branchMap = new Map<string, string>(branchRows.map((row) => [stringOrEmpty(row.id), stringOrEmpty(row.name) || stringOrEmpty(row.id)]));

  const orderOptions: AdminMessageOption[] = orderRows.map((row) => ({
    id: stringOrEmpty(row.id),
    label: `#${stringOrEmpty(row.order_code || row.id)}${branchMap.get(stringOrEmpty(row.branch_id)) ? ` - ${branchMap.get(stringOrEmpty(row.branch_id))}` : ''}`,
  }));

  const participantOptions: AdminMessageOption[] = uniqueStrings([
    ...staffRows.map((row) => stringOrEmpty(row.user_id)),
    ...customerRows.map((row) => stringOrEmpty(row.user_id)),
    ...driverIds,
  ]).map((userId) => {
    const profile = profileMap.get(userId);
    return {
      id: userId,
      label: stringOrEmpty(profile?.full_name) || stringOrEmpty(profile?.email) || userId,
    };
  });

  return {
    data: {
      branchMap,
      orderRows,
      orderOptions,
      orderMap: new Map<string, any>(orderRows.map((row) => [stringOrEmpty(row.id), row])),
      participantOptions,
      profileMap,
      staffUserIds: uniqueStrings(staffRows.map((row) => stringOrEmpty(row.user_id))),
    },
    error: null,
  };
}

function buildMessagePreview(body: string) {
  if (!body) return 'Sin mensaje';
  return body.length > 72 ? `${body.slice(0, 72)}...` : body;
}

function getUserLabel(profileMap: Map<string, any>, userId: string) {
  const profile = profileMap.get(userId);
  return stringOrEmpty(profile?.full_name) || stringOrEmpty(profile?.email) || userId || 'Usuario';
}

export const adminMessagesService = {
  createEmptyConversationForm: (): ConversationCreateForm => ({
    order_id: '',
    conversation_type: 'order_support',
    status: 'open',
    participant_user_id: '',
    participant_role: 'customer',
    initial_message: '',
  }),

  createEmptyConversationStatusForm: (): ConversationStatusForm => ({
    status: 'open',
  }),

  createConversationStatusForm: (status: string): ConversationStatusForm => ({
    status: status || 'open',
  }),

  createEmptyParticipantForm: (): ConversationParticipantForm => ({
    user_id: '',
    participant_role: 'staff',
  }),

  createEmptyMessageForm: (): ConversationMessageForm => ({
    message_type: 'text',
    body: '',
    file_url: '',
    is_system: false,
  }),

  fetchMessagesOverview: async (merchantId: string, currentUserId: string | null) => {
    const lookupsResult = await fetchMessagingLookups(merchantId);
    if (lookupsResult.error) return { data: null, error: lookupsResult.error };

    const { orderRows, orderOptions, orderMap, branchMap, participantOptions, profileMap, staffUserIds } = lookupsResult.data!;
    const orderIds = uniqueStrings(orderRows.map((row) => stringOrEmpty(row.id)));

    const [conversationsByOrderResult, conversationsByCreatorResult, participantSeedResult, notificationsResult] = await Promise.all([
      orderIds.length > 0
        ? supabase.from('conversations').select('*').in('order_id', orderIds).order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null } as any),
      staffUserIds.length > 0
        ? supabase.from('conversations').select('*').in('created_by', staffUserIds).order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null } as any),
      staffUserIds.length > 0
        ? supabase.from('conversation_participants').select('*').in('user_id', staffUserIds)
        : Promise.resolve({ data: [], error: null } as any),
      staffUserIds.length > 0
        ? supabase.from('notifications').select('*').in('user_id', staffUserIds).order('created_at', { ascending: false }).limit(100)
        : Promise.resolve({ data: [], error: null } as any),
    ]);

    if (conversationsByOrderResult.error) return { data: null, error: conversationsByOrderResult.error };
    if (conversationsByCreatorResult.error) return { data: null, error: conversationsByCreatorResult.error };
    if (participantSeedResult.error) return { data: null, error: participantSeedResult.error };
    if (notificationsResult.error) return { data: null, error: notificationsResult.error };

    const participantSeedRows = (participantSeedResult.data ?? []) as any[];
    const participantConversationIds = uniqueStrings(participantSeedRows.map((row) => stringOrEmpty(row.conversation_id)));
    const conversationsByParticipantResult =
      participantConversationIds.length > 0
        ? await supabase.from('conversations').select('*').in('id', participantConversationIds).order('created_at', { ascending: false })
        : ({ data: [], error: null } as any);

    if (conversationsByParticipantResult.error) return { data: null, error: conversationsByParticipantResult.error };

    const conversationRows = [
      ...((conversationsByOrderResult.data ?? []) as any[]),
      ...((conversationsByCreatorResult.data ?? []) as any[]),
      ...((conversationsByParticipantResult.data ?? []) as any[]),
    ];
    const conversations = Array.from(new Map(conversationRows.map((row) => [stringOrEmpty(row.id), row])).values());
    const conversationIds = uniqueStrings(conversations.map((row) => stringOrEmpty(row.id)));

    const [participantResult, messageResult] = await Promise.all([
      conversationIds.length > 0
        ? supabase.from('conversation_participants').select('*').in('conversation_id', conversationIds).order('joined_at', { ascending: true })
        : Promise.resolve({ data: [], error: null } as any),
      conversationIds.length > 0
        ? supabase.from('messages').select('*').in('conversation_id', conversationIds).order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null } as any),
    ]);

    if (participantResult.error) return { data: null, error: participantResult.error };
    if (messageResult.error) return { data: null, error: messageResult.error };

    const participantRows = (participantResult.data ?? []) as any[];
    const messageRows = (messageResult.data ?? []) as any[];
    const messageIds = uniqueStrings(messageRows.map((row) => stringOrEmpty(row.id)));
    const messageReadsResult =
      messageIds.length > 0
        ? await supabase.from('message_reads').select('*').in('message_id', messageIds)
        : ({ data: [], error: null } as any);

    if (messageReadsResult.error) return { data: null, error: messageReadsResult.error };

    const readRows = (messageReadsResult.data ?? []) as any[];
    const readSet = new Set(
      readRows
        .filter((row) => stringOrEmpty(row.user_id) === stringOrEmpty(currentUserId))
        .map((row) => `${stringOrEmpty(row.message_id)}:${stringOrEmpty(row.user_id)}`)
    );

    const notificationRows = (notificationsResult.data ?? []) as any[];
    const notificationUserIds = uniqueStrings(notificationRows.map((row) => stringOrEmpty(row.user_id)));
    const missingProfileIds = notificationUserIds.filter((userId) => !profileMap.has(userId));
    if (missingProfileIds.length > 0) {
      const missingProfilesResult = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', missingProfileIds);
      if (missingProfilesResult.error) return { data: null, error: missingProfilesResult.error };
      ((missingProfilesResult.data ?? []) as any[]).forEach((row) => {
        profileMap.set(stringOrEmpty(row.user_id), row);
      });
    }

    const conversationsOverview: ConversationOverviewRecord[] = conversations.map((row) => {
      const conversationId = stringOrEmpty(row.id);
      const currentParticipants = participantRows.filter((participant) => stringOrEmpty(participant.conversation_id) === conversationId);
      const currentMessages = messageRows.filter((message) => stringOrEmpty(message.conversation_id) === conversationId);
      const lastMessage = currentMessages[0];
      const unreadCount = currentUserId
        ? currentMessages.filter(
            (message) =>
              stringOrEmpty(message.sender_user_id) !== stringOrEmpty(currentUserId) &&
              !readSet.has(`${stringOrEmpty(message.id)}:${stringOrEmpty(currentUserId)}`)
          ).length
        : 0;
      const participantLabels = currentParticipants
        .map((participant) => getUserLabel(profileMap, stringOrEmpty(participant.user_id)))
        .filter(Boolean)
        .slice(0, 3);
      const order = orderMap.get(stringOrEmpty(row.order_id));

      return {
        id: conversationId,
        order_id: stringOrEmpty(row.order_id),
        order_code: stringOrEmpty(order?.order_code || row.order_id),
        branch_label: branchMap.get(stringOrEmpty(order?.branch_id)) || 'Sin sucursal',
        conversation_type: stringOrEmpty(row.conversation_type),
        status: stringOrEmpty(row.status),
        created_at: stringOrEmpty(row.created_at),
        created_by_label: getUserLabel(profileMap, stringOrEmpty(row.created_by)),
        participants_summary: participantLabels.join(', ') || 'Sin participantes',
        messages_count: currentMessages.length,
        unread_count: unreadCount,
        last_message_preview: buildMessagePreview(stringOrEmpty(lastMessage?.body)),
        last_message_at: stringOrEmpty(lastMessage?.created_at || row.created_at),
      };
    });

    const notifications: NotificationOverviewRecord[] = notificationRows.map((row) => ({
      id: stringOrEmpty(row.id),
      user_id: stringOrEmpty(row.user_id),
      user_label: getUserLabel(profileMap, stringOrEmpty(row.user_id)),
      channel: stringOrEmpty(row.channel),
      type: stringOrEmpty(row.type),
      title: stringOrEmpty(row.title),
      body: stringOrEmpty(row.body),
      entity_type: stringOrEmpty(row.entity_type),
      entity_id: stringOrEmpty(row.entity_id),
      status: stringOrEmpty(row.status),
      sent_at: stringOrEmpty(row.sent_at),
      read_at: stringOrEmpty(row.read_at),
      created_at: stringOrEmpty(row.created_at),
    }));

    return {
      data: {
        conversations: conversationsOverview.sort((left, right) => String(right.last_message_at).localeCompare(String(left.last_message_at))),
        notifications,
        participant_options: participantOptions,
        order_options: orderOptions,
      } satisfies MessagesOverview,
      error: null,
    };
  },

  fetchConversationDetail: async (merchantId: string, conversationId: string) => {
    const lookupsResult = await fetchMessagingLookups(merchantId);
    if (lookupsResult.error) return { data: null, error: lookupsResult.error };

    const { orderOptions, orderMap, branchMap, participantOptions, profileMap, staffUserIds } = lookupsResult.data!;
    const [conversationResult, participantResult, messageResult] = await Promise.all([
      supabase.from('conversations').select('*').eq('id', conversationId).maybeSingle(),
      supabase.from('conversation_participants').select('*').eq('conversation_id', conversationId).order('joined_at', { ascending: true }),
      supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true }),
    ]);

    if (conversationResult.error) return { data: null, error: conversationResult.error };
    if (participantResult.error) return { data: null, error: participantResult.error };
    if (messageResult.error) return { data: null, error: messageResult.error };
    if (!conversationResult.data) return { data: null, error: null };

    const conversation: any = conversationResult.data;
    const participantRows = (participantResult.data ?? []) as any[];
    const accessibleFromOrder = conversation.order_id ? orderMap.has(stringOrEmpty(conversation.order_id)) : false;
    const accessibleFromPeople =
      staffUserIds.includes(stringOrEmpty(conversation.created_by)) ||
      participantRows.some((row) => staffUserIds.includes(stringOrEmpty(row.user_id)));

    if (!accessibleFromOrder && !accessibleFromPeople) {
      return { data: null, error: null };
    }

    const messageRows = (messageResult.data ?? []) as any[];
    const messageIds = uniqueStrings(messageRows.map((row) => stringOrEmpty(row.id)));
    const messageReadsResult =
      messageIds.length > 0
        ? await supabase.from('message_reads').select('*').in('message_id', messageIds)
        : ({ data: [], error: null } as any);

    if (messageReadsResult.error) return { data: null, error: messageReadsResult.error };

    const readRows = (messageReadsResult.data ?? []) as any[];
    const missingProfileIds = uniqueStrings([
      stringOrEmpty(conversation.created_by),
      ...participantRows.map((row) => stringOrEmpty(row.user_id)),
      ...messageRows.map((row) => stringOrEmpty(row.sender_user_id)),
      ...readRows.map((row) => stringOrEmpty(row.user_id)),
    ]).filter((userId) => !profileMap.has(userId));

    if (missingProfileIds.length > 0) {
      const missingProfilesResult = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', missingProfileIds);
      if (missingProfilesResult.error) return { data: null, error: missingProfilesResult.error };
      ((missingProfilesResult.data ?? []) as any[]).forEach((row) => {
        profileMap.set(stringOrEmpty(row.user_id), row);
      });
    }

    const order = orderMap.get(stringOrEmpty(conversation.order_id));
    const participants: ConversationParticipantRecord[] = participantRows.map((row) => ({
      id: stringOrEmpty(row.id),
      user_id: stringOrEmpty(row.user_id),
      user_label: getUserLabel(profileMap, stringOrEmpty(row.user_id)),
      participant_role: stringOrEmpty(row.participant_role),
      joined_at: stringOrEmpty(row.joined_at),
      left_at: stringOrEmpty(row.left_at),
    }));

    const messages: ConversationMessageRecord[] = messageRows.map((row) => {
      const readers = readRows.filter((read) => stringOrEmpty(read.message_id) === stringOrEmpty(row.id));
      return {
        id: stringOrEmpty(row.id),
        sender_user_id: stringOrEmpty(row.sender_user_id),
        sender_label: getUserLabel(profileMap, stringOrEmpty(row.sender_user_id)),
        message_type: stringOrEmpty(row.message_type),
        body: stringOrEmpty(row.body),
        file_url: stringOrEmpty(row.file_url),
        is_system: Boolean(row.is_system ?? false),
        created_at: stringOrEmpty(row.created_at),
        read_count: readers.length,
        readers_label: readers.map((read) => getUserLabel(profileMap, stringOrEmpty(read.user_id))).join(', '),
      };
    });

    return {
      data: {
        id: stringOrEmpty(conversation.id),
        order_id: stringOrEmpty(conversation.order_id),
        order_code: stringOrEmpty(order?.order_code || conversation.order_id),
        branch_label: branchMap.get(stringOrEmpty(order?.branch_id)) || 'Sin sucursal',
        conversation_type: stringOrEmpty(conversation.conversation_type),
        status: stringOrEmpty(conversation.status),
        created_at: stringOrEmpty(conversation.created_at),
        created_by: stringOrEmpty(conversation.created_by),
        created_by_label: getUserLabel(profileMap, stringOrEmpty(conversation.created_by)),
        participants,
        messages,
        available_participants: participantOptions,
        order_options: orderOptions,
      } satisfies ConversationDetail,
      error: null,
    };
  },

  createConversation: async (merchantId: string, actorUserId: string, form: ConversationCreateForm) => {
    const now = new Date().toISOString();
    const conversationInsert = await supabase
      .from('conversations')
      .insert({
        order_id: nullableString(form.order_id),
        conversation_type: form.conversation_type.trim() || 'order_support',
        status: form.status.trim() || 'open',
        created_by: actorUserId,
        created_at: now,
      })
      .select('*')
      .single();

    if (conversationInsert.error) return conversationInsert;

    const conversation = conversationInsert.data as any;
    const participantUserIds = uniqueStrings([actorUserId, form.participant_user_id]);
    if (participantUserIds.length > 0) {
      const participantsInsert = await supabase.from('conversation_participants').insert(
        participantUserIds.map((userId) => ({
          conversation_id: conversation.id,
          user_id: userId,
          participant_role: userId === actorUserId ? 'staff' : form.participant_role.trim() || 'customer',
          joined_at: now,
          left_at: null,
        }))
      );
      if (participantsInsert.error) return participantsInsert;
    }

    let messageId = '';
    if (form.initial_message.trim()) {
      const messageInsert = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_user_id: actorUserId,
          message_type: 'text',
          body: form.initial_message.trim(),
          file_url: null,
          is_system: false,
          created_at: now,
        })
        .select('*')
        .single();
      if (messageInsert.error) return messageInsert;
      messageId = stringOrEmpty((messageInsert.data as any)?.id);
    }

    const recipients = participantUserIds.filter((userId) => userId !== actorUserId);
    if (recipients.length > 0) {
      const notificationsInsert = await supabase.from('notifications').insert(
        recipients.map((userId) => ({
          user_id: userId,
          channel: 'in_app',
          type: 'conversation_message',
          title: 'Nueva conversacion',
          body: form.initial_message.trim() || 'Se te agrego a una conversacion',
          entity_type: 'conversation',
          entity_id: conversation.id,
          payload_json: {
            message_id: messageId || null,
            order_id: nullableString(form.order_id),
          },
          status: 'pending',
          sent_at: now,
          read_at: null,
          created_at: now,
        }))
      );
      if (notificationsInsert.error) return notificationsInsert;
    }

    let branchId: string | undefined;
    if (conversation.order_id) {
      const orderResult = await supabase.from('orders').select('id, branch_id').eq('id', conversation.order_id).maybeSingle();
      if (!orderResult.error) {
        branchId = stringOrEmpty((orderResult.data as any)?.branch_id) || undefined;
      }
    }

    await logAdminSideEffects({
      actorUserId,
      merchantId,
      branchId,
      entityType: 'conversation',
      entityId: stringOrEmpty(conversation.id),
      action: 'conversation_created',
      newValues: {
        conversation_type: form.conversation_type,
        status: form.status,
        participant_user_id: form.participant_user_id,
      },
      orderId: stringOrEmpty(conversation.order_id) || undefined,
      eventName: 'admin_conversation_created',
    });

    return { data: { id: stringOrEmpty(conversation.id) }, error: null };
  },

  updateConversationStatus: async (merchantId: string, actorUserId: string, conversationId: string, form: ConversationStatusForm) => {
    const existingResult = await supabase.from('conversations').select('*').eq('id', conversationId).maybeSingle();
    if (existingResult.error) return existingResult;

    const updateResult = await supabase
      .from('conversations')
      .update({
        status: form.status.trim() || 'open',
      })
      .eq('id', conversationId)
      .select('*')
      .single();

    if (updateResult.error) return updateResult;

    const orderId = stringOrEmpty((updateResult.data as any)?.order_id);
    let branchId: string | undefined;
    if (orderId) {
      const orderResult = await supabase.from('orders').select('branch_id').eq('id', orderId).maybeSingle();
      if (!orderResult.error) {
        branchId = stringOrEmpty((orderResult.data as any)?.branch_id) || undefined;
      }
    }

    await logAdminSideEffects({
      actorUserId,
      merchantId,
      branchId,
      entityType: 'conversation',
      entityId: conversationId,
      action: 'conversation_status_updated',
      oldValues: existingResult.data,
      newValues: updateResult.data,
      orderId: orderId || undefined,
      eventName: 'admin_conversation_status_updated',
    });

    return updateResult;
  },

  addParticipant: async (merchantId: string, actorUserId: string, conversationId: string, form: ConversationParticipantForm) => {
    const existingParticipant = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', form.user_id)
      .is('left_at', null)
      .maybeSingle();

    if (existingParticipant.error) return existingParticipant;
    if (existingParticipant.data) return { data: existingParticipant.data, error: null };

    const now = new Date().toISOString();
    const insertResult = await supabase
      .from('conversation_participants')
      .insert({
        conversation_id: conversationId,
        user_id: form.user_id.trim(),
        participant_role: form.participant_role.trim() || 'staff',
        joined_at: now,
        left_at: null,
      })
      .select('*')
      .single();

    if (insertResult.error) return insertResult;

    const conversationResult = await supabase.from('conversations').select('id, order_id').eq('id', conversationId).maybeSingle();
    const orderId = stringOrEmpty((conversationResult.data as any)?.order_id);
    let branchId: string | undefined;
    if (orderId) {
      const orderResult = await supabase.from('orders').select('branch_id').eq('id', orderId).maybeSingle();
      if (!orderResult.error) {
        branchId = stringOrEmpty((orderResult.data as any)?.branch_id) || undefined;
      }
    }

    await supabase.from('notifications').insert({
      user_id: form.user_id.trim(),
      channel: 'in_app',
      type: 'conversation_participant_added',
      title: 'Nueva asignacion en conversacion',
      body: 'Se te agrego a una conversacion del admin',
      entity_type: 'conversation',
      entity_id: conversationId,
      payload_json: {
        participant_role: form.participant_role.trim() || 'staff',
      },
      status: 'pending',
      sent_at: now,
      read_at: null,
      created_at: now,
    });

    await logAdminSideEffects({
      actorUserId,
      merchantId,
      branchId,
      entityType: 'conversation_participant',
      entityId: stringOrEmpty((insertResult.data as any)?.id),
      action: 'conversation_participant_added',
      newValues: insertResult.data,
      orderId: orderId || undefined,
      eventName: 'admin_conversation_participant_added',
    });

    return insertResult;
  },

  sendMessage: async (merchantId: string, actorUserId: string, conversationId: string, form: ConversationMessageForm) => {
    const now = new Date().toISOString();
    const messageInsert = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_user_id: actorUserId,
        message_type: form.message_type.trim() || 'text',
        body: nullableString(form.body),
        file_url: nullableString(form.file_url),
        is_system: form.is_system,
        created_at: now,
      })
      .select('*')
      .single();

    if (messageInsert.error) return messageInsert;

    const [participantsResult, conversationResult] = await Promise.all([
      supabase.from('conversation_participants').select('user_id').eq('conversation_id', conversationId).is('left_at', null),
      supabase.from('conversations').select('order_id').eq('id', conversationId).maybeSingle(),
    ]);

    if (participantsResult.error) return participantsResult;
    if (conversationResult.error) return conversationResult;

    const recipients = uniqueStrings(((participantsResult.data ?? []) as any[]).map((row) => stringOrEmpty(row.user_id))).filter(
      (userId) => userId !== actorUserId
    );
    const orderId = stringOrEmpty((conversationResult.data as any)?.order_id);
    let branchId: string | undefined;
    if (orderId) {
      const orderResult = await supabase.from('orders').select('branch_id').eq('id', orderId).maybeSingle();
      if (!orderResult.error) {
        branchId = stringOrEmpty((orderResult.data as any)?.branch_id) || undefined;
      }
    }

    if (recipients.length > 0) {
      const notificationsInsert = await supabase.from('notifications').insert(
        recipients.map((userId) => ({
          user_id: userId,
          channel: 'in_app',
          type: 'conversation_message',
          title: 'Nuevo mensaje',
          body: form.body.trim() || 'Se envio un mensaje del sistema',
          entity_type: 'conversation',
          entity_id: conversationId,
          payload_json: {
            message_id: stringOrEmpty((messageInsert.data as any)?.id),
            order_id: orderId || null,
          },
          status: 'pending',
          sent_at: now,
          read_at: null,
          created_at: now,
        }))
      );
      if (notificationsInsert.error) return notificationsInsert;
    }

    await logAdminSideEffects({
      actorUserId,
      merchantId,
      branchId,
      entityType: 'message',
      entityId: stringOrEmpty((messageInsert.data as any)?.id),
      action: 'conversation_message_sent',
      newValues: messageInsert.data,
      orderId: orderId || undefined,
      eventName: 'admin_message_sent',
    });

    return messageInsert;
  },

  markConversationRead: async (conversationId: string, actorUserId: string) => {
    const messagesResult = await supabase.from('messages').select('id').eq('conversation_id', conversationId);
    if (messagesResult.error) return messagesResult;

    const messageIds = uniqueStrings(((messagesResult.data ?? []) as any[]).map((row) => stringOrEmpty(row.id)));
    const existingReadsResult =
      messageIds.length > 0
        ? await supabase.from('message_reads').select('message_id').eq('user_id', actorUserId).in('message_id', messageIds)
        : ({ data: [], error: null } as any);

    if (existingReadsResult.error) return existingReadsResult;

    const existingReadSet = new Set(((existingReadsResult.data ?? []) as any[]).map((row) => stringOrEmpty(row.message_id)));
    const now = new Date().toISOString();
    const missingReads = messageIds
      .filter((messageId) => !existingReadSet.has(messageId))
      .map((messageId) => ({
        message_id: messageId,
        user_id: actorUserId,
        read_at: now,
      }));

    if (missingReads.length > 0) {
      const insertReadsResult = await supabase.from('message_reads').insert(missingReads);
      if (insertReadsResult.error) return insertReadsResult;
    }

    const notificationUpdate = await supabase
      .from('notifications')
      .update({
        status: 'read',
        read_at: now,
      })
      .eq('user_id', actorUserId)
      .eq('entity_type', 'conversation')
      .eq('entity_id', conversationId);

    if (notificationUpdate.error) return notificationUpdate;

    return { data: { inserted: missingReads.length }, error: null };
  },

  markNotificationRead: async (notificationId: string) => {
    const now = new Date().toISOString();
    return supabase
      .from('notifications')
      .update({
        status: 'read',
        read_at: now,
      })
      .eq('id', notificationId)
      .select('id')
      .single();
  },
};
