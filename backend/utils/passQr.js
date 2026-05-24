import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";

export function buildPassQrPayload({
  token,
  eventId,
  passType,
  registrationId,
  participantId,
}) {
  const payload = {
    token,
    eventId: String(eventId),
    passType,
    registrationId: String(registrationId),
  };

  if (participantId) {
    payload.participantId = String(participantId);
  }

  return JSON.stringify(payload);
}

export async function generatePassQrImage(payload) {
  return QRCode.toDataURL(payload);
}

export async function createInvestorPassQr({ eventId, registrationId }) {
  const token = uuidv4();
  const qrData = buildPassQrPayload({
    token,
    eventId,
    passType: "investor",
    registrationId,
  });
  const qrCodeImage = await generatePassQrImage(qrData);
  return { qrToken: token, qrCodeImage };
}

export async function createGuestPassQr({ eventId, registrationId, participantId }) {
  const token = uuidv4();
  const qrData = buildPassQrPayload({
    token,
    eventId,
    passType: "guest",
    registrationId,
    participantId,
  });
  const qrCodeImage = await generatePassQrImage(qrData);
  return {
    qrToken: token,
    qrCodeImage,
    isCheckedIn: false,
    checkedInAt: null,
  };
}

/**
 * Generate missing investor / guest pass QRs on an existing registration document.
 */
export async function ensureParticipantPasses(registration) {
  if (!registration) return registration;

  const eventId = registration.eventId;
  const registrationId = registration._id;
  let modified = false;

  const needsParticipantIds = (registration.participants || []).some(
    (participant) => !participant.qrToken && !participant._id
  );

  if (needsParticipantIds) {
    await registration.save();
  }

  if (!registration.qrToken) {
    const pass = await createInvestorPassQr({ eventId, registrationId });
    registration.qrToken = pass.qrToken;
    registration.qrCodeImage = pass.qrCodeImage;
    modified = true;
  }

  for (const participant of registration.participants || []) {
    if (!participant.qrToken && participant._id) {
      const pass = await createGuestPassQr({
        eventId,
        registrationId,
        participantId: participant._id,
      });
      participant.qrToken = pass.qrToken;
      participant.qrCodeImage = pass.qrCodeImage;
      if (participant.isCheckedIn == null) participant.isCheckedIn = false;
      if (participant.checkedInAt == null) participant.checkedInAt = null;
      modified = true;
    }
  }

  if (modified) {
    await registration.save();
  }

  return registration;
}

export function findPassByToken(registration, token) {
  if (!registration || !token) return null;

  if (registration.qrToken === token) {
    return { passType: "investor", participantIndex: -1 };
  }

  const participants = registration.participants || [];
  for (let i = 0; i < participants.length; i++) {
    if (participants[i].qrToken === token) {
      return { passType: "guest", participantIndex: i };
    }
  }

  return null;
}
