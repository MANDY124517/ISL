/**
 * Legal Modals: Terms of Service & Privacy Policy
 * Addresses PRD Section 21 & user guidelines (transparent disclosures, zero dark patterns).
 */
import { CloseIcon, ShieldIcon, FileTextIcon } from './icons'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TermsModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-[#181c22] border border-[#2c3542] w-full max-w-2xl max-h-[85vh] flex flex-col rounded-sm">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2c3542] bg-[#14171c]">
          <div className="flex items-center gap-2">
            <FileTextIcon className="w-5 h-5 text-[#0284c7]" />
            <h2 className="text-base font-bold text-gray-100">Terms of Service</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white border border-transparent hover:border-[#3d4858]"
            aria-label="Close Terms of Service"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto text-sm text-gray-300 space-y-4 leading-relaxed font-sans">
          <p>
            <strong>Effective Date:</strong> October 2026
          </p>
          <p>
            Welcome to <strong>SignBridge</strong>. By accessing or using this application, you agree to comply with and be bound by the following Terms of Service.
          </p>

          <h3 className="text-gray-100 font-semibold pt-2 text-sm uppercase tracking-wider">
            1. Purpose of the Platform
          </h3>
          <p>
            SignBridge is an assistive communication interface designed to bridge real-time communication between Indian Sign Language (ISL) users and non-signers using computer vision and machine learning models. It is an experimental and educational system intended to facilitate day-to-day interpersonal exchanges.
          </p>

          <h3 className="text-gray-100 font-semibold pt-2 text-sm uppercase tracking-wider">
            2. Medical and Emergency Disclaimer
          </h3>
          <p>
            SignBridge is <strong>not</strong> a certified medical diagnostic device, emergency dispatch medium, or legal interpretation service. In critical healthcare, legal, or emergency situations, verified human interpreters must be consulted.
          </p>

          <h3 className="text-gray-100 font-semibold pt-2 text-sm uppercase tracking-wider">
            3. Dataset and Licensing
          </h3>
          <p>
            Model weights, class definitions, and benchmark training data incorporate resources from the <strong>ISLTranslate</strong> and <strong>iSign</strong> projects (Exploration Lab, IIT Kanpur). The dataset is distributed under the <strong>Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)</strong> license. Commercial exploitation of the models without prior authorization is prohibited.
          </p>

          <h3 className="text-gray-100 font-semibold pt-2 text-sm uppercase tracking-wider">
            4. User Responsibilities
          </h3>
          <p>
            Users are responsible for ensuring that camera permissions and audio input comply with local privacy laws and organizational workplace policies when operating in shared environments.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#2c3542] bg-[#14171c] flex justify-end">
          <button onClick={onClose} className="btn btn-secondary">
            Acknowledge and Close
          </button>
        </div>
      </div>
    </div>
  )
}

export function PrivacyModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-[#181c22] border border-[#2c3542] w-full max-w-2xl max-h-[85vh] flex flex-col rounded-sm">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2c3542] bg-[#14171c]">
          <div className="flex items-center gap-2">
            <ShieldIcon className="w-5 h-5 text-[#0284c7]" />
            <h2 className="text-base font-bold text-gray-100">Privacy Policy</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white border border-transparent hover:border-[#3d4858]"
            aria-label="Close Privacy Policy"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto text-sm text-gray-300 space-y-4 leading-relaxed font-sans">
          <p>
            <strong>Last Updated:</strong> October 2026
          </p>
          <p>
            SignBridge is built on strict data minimization and privacy-by-design principles. We recognize the sensitive nature of video and audio capture in sign language applications.
          </p>

          <h3 className="text-gray-100 font-semibold pt-2 text-sm uppercase tracking-wider">
            1. Ephemeral Video Stream Processing
          </h3>
          <p>
            Video frames captured by your browser camera are evaluated strictly in volatile RAM memory. No video recordings, static images, or identifiable facial features are written to persistent storage, hard disks, or third-party cloud servers.
          </p>

          <h3 className="text-gray-100 font-semibold pt-2 text-sm uppercase tracking-wider">
            2. Landmark Feature Coordinates
          </h3>
          <p>
            The vision extraction layer computes abstract 3D joint landmark coordinates (21 hand joints, 33 body posture coordinates). These numerical vectors do not contain biometric identifiers or pixel textures. Once inference is completed by the neural model, coordinates are discarded immediately.
          </p>

          <h3 className="text-gray-100 font-semibold pt-2 text-sm uppercase tracking-wider">
            3. Microphone and Speech Processing
          </h3>
          <p>
            Voice input for the non-signer direction is handled via the browser's native Web Speech API (`webkitSpeechRecognition`). Audio is not recorded or stored by SignBridge.
          </p>

          <h3 className="text-gray-100 font-semibold pt-2 text-sm uppercase tracking-wider">
            4. Local Execution Guarantee
          </h3>
          <p>
            In local deployment mode, inference occurs exclusively on the local network (`http://localhost:8000`). No telemetry, analytics trackers, or commercial pixels are included in this application.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#2c3542] bg-[#14171c] flex justify-end">
          <button onClick={onClose} className="btn btn-secondary">
            Acknowledge and Close
          </button>
        </div>
      </div>
    </div>
  )
}
