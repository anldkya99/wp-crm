import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  serializeAlarm,
  serializeAutomationDecisionLog,
  serializeAutomationSetting,
  serializeAutomationTaskLog,
  serializeCommunicationLine,
  serializeCommunicationSession,
  serializeContact,
  serializeContactOwnershipRequest,
  serializeConversation,
  serializeCustomerNote,
  serializeMemberTag,
  serializeMessage,
  serializeOperator,
  serializeOperatorLineSession,
  serializeRequest,
  serializeTask,
  serializeTemplate,
  serializeTimelineEvent,
  serializeTtsUsageLog,
  serializeVoiceTemplate
} from "@/lib/server/serializers";

export async function GET() {
  const [
    contacts,
    requests,
    conversations,
    messages,
    templates,
    voiceTemplates,
    communicationLines,
    communicationSessions,
    operatorLineSessions,
    ownershipRequests,
    memberTags,
    automationSettings,
    automationLogs,
    automationDecisionLogs,
    operators,
    ttsUsageLogs,
    tasks,
    customerNotes,
    timelineEvents,
    alarms
  ] = await Promise.all([
    prisma.contact.findMany({ orderBy: { updatedAt: "desc" }, include: { tagRelations: { include: { tag: true } } } }),
    prisma.request.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.conversation.findMany({
      orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
      include: { messages: { select: { senderType: true, status: true } } }
    }),
    prisma.message.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.messageTemplate.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.voiceTemplate.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.communicationLine.findMany({ orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] }),
    prisma.communicationSession.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.operatorLineSession.findMany({ orderBy: [{ operatorId: "asc" }, { slotNumber: "asc" }] }),
    prisma.contactOwnershipRequest.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.memberTag.findMany({ orderBy: { name: "asc" } }),
    prisma.automationRuleSetting.findMany({ orderBy: { key: "asc" } }),
    prisma.automationTaskLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.automationDecisionLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.ttsUsageLog.findMany({ orderBy: { createdAt: "desc" }, take: 1000 }),
    prisma.dailyTask.findMany({
      orderBy: [{ taskDate: "desc" }, { createdAt: "desc" }],
      include: { notes: { orderBy: { createdAt: "desc" }, include: { creator: { select: { name: true } } } } }
    }),
    prisma.customerNote.findMany({
      orderBy: { createdAt: "desc" },
      include: { creator: { select: { name: true } } }
    }),
    prisma.timelineEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 1000,
      include: { operator: { select: { name: true } } }
    }),
    prisma.alarm.findMany({ orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }] })
  ]);

  return NextResponse.json({
    contacts: contacts.map(serializeContact),
    requests: requests.map(serializeRequest),
    conversations: conversations.map(serializeConversation),
    messages: messages.map(serializeMessage),
    templates: templates.map(serializeTemplate),
    voiceTemplates: voiceTemplates.map(serializeVoiceTemplate),
    communicationLines: communicationLines.map(serializeCommunicationLine),
    communicationSessions: communicationSessions.map(serializeCommunicationSession),
    operatorLineSessions: operatorLineSessions.map(serializeOperatorLineSession),
    ownershipRequests: ownershipRequests.map(serializeContactOwnershipRequest),
    memberTags: memberTags.map(serializeMemberTag),
    automationSettings: automationSettings.map(serializeAutomationSetting),
    automationLogs: automationLogs.map(serializeAutomationTaskLog),
    automationDecisionLogs: automationDecisionLogs.map(serializeAutomationDecisionLog),
    operators: operators.map(serializeOperator),
    ttsUsageLogs: ttsUsageLogs.map(serializeTtsUsageLog),
    tasks: tasks.map(serializeTask),
    customerNotes: customerNotes.map(serializeCustomerNote),
    timelineEvents: timelineEvents.map(serializeTimelineEvent),
    alarms: alarms.map(serializeAlarm)
  });
}
