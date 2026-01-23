import React, { useState, useRef } from 'react';
import { ParkingInfo } from '../types';

interface ParkingWidgetProps {
  info: ParkingInfo;
  onChange: (newInfo: ParkingInfo) => void;
}

const ParkingWidget: React.FC<ParkingWidgetProps> = ({ info, onChange }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('카메라를 시작할 수 없습니다. 권한을 확인해주세요.');
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL('image/jpeg');
        
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        
        onChange({ ...info, image: imageData });
        setIsCameraOpen(false);
      }
    }
  };

  const clearPhoto = () => {
    if (window.confirm('사진을 삭제하시겠습니까?')) {
      onChange({ ...info, image: null });
    }
  };

  return (
    <section className="bg-white px-4 py-4 rounded-2xl shadow-sm border border-slate-400 flex flex-col h-[350px]">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          🚗 주차위치
        </h2>
        {info.image && (
          <button onClick={clearPhoto} className="text-[9px] text-red-500 hover:underline font-medium">사진 삭제</button>
        )}
      </div>
      
      <div className="flex-1 flex flex-col gap-3 overflow-hidden">
        <div className="flex-shrink-0 space-y-2">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 mb-0.5 uppercase tracking-wider">Location Info</label>
            <input
              type="text"
              value={info.text}
              onChange={(e) => onChange({ ...info, text: e.target.value })}
              placeholder="예: B2 14C"
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-500 text-xs text-slate-700 font-medium placeholder:text-slate-300"
            />
          </div>

          {!isCameraOpen ? (
            <button
              onClick={startCamera}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-[10px] transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
            >
              📷 촬영 시작
            </button>
          ) : (
            <div className="space-y-1.5">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video border border-slate-400">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={capturePhoto}
                  className="flex-1 py-1.5 bg-blue-500 text-white rounded-lg font-bold text-[10px] shadow-sm"
                >
                  촬영
                </button>
                <button
                  onClick={() => setIsCameraOpen(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg font-bold text-[10px]"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-xl bg-slate-50/50 relative overflow-hidden min-h-0">
          {info.image ? (
            <img src={info.image} alt="주차 위치" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-2">
              <p className="text-slate-400 text-[10px] italic">사진 미리보기</p>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </section>
  );
};

export default ParkingWidget;