import useRecommendForm from "../hooks/UseRecommendFrom";
import {
  StepSavingPlan,
  StepRegion,
  StepBasicInfo,
  StepBenefits,
  StepPersonalInfo,
  StepHouseholdIncome,
  StepHousing,
  StepEmployment,
  StepTransaction,
  LoadingScreen,
} from "../components/RecommendSteps";
import { useState } from "react";

export default function Recommend() {
  const { step, formData, setFormData, cats, loading, go, handleSubmit } = useRecommendForm();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const startAnalysis = () => {
    setIsOpen(false);
    setIsAnalyzing(true);
  };

  const finishAnalysis = async () => {
    await handleSubmit();
  };

  const steps = [
    <StepSavingPlan      data={formData} setData={setFormData} cats={cats} onNext={go(1)} />,
    <StepBasicInfo       data={formData} setData={setFormData} cats={cats} onPrev={go(0)} onNext={go(2)} />,
    <StepBenefits        data={formData} setData={setFormData} cats={cats} onPrev={go(1)} onNext={go(3)} />,
    <StepPersonalInfo    data={formData} setData={setFormData}             onPrev={go(2)} onNext={go(4)} />,
    <StepRegion          data={formData} setData={setFormData} cats={cats} onPrev={go(3)} onNext={go(5)} />,
    <StepHouseholdIncome data={formData} setData={setFormData} cats={cats} onPrev={go(4)} onNext={go(6)} />,
    <StepHousing         data={formData} setData={setFormData}             onPrev={go(5)} onNext={go(7)} />,
    <StepEmployment      data={formData} setData={setFormData}             onPrev={go(6)} onNext={go(8)} />,
    <StepTransaction     data={formData} setData={setFormData} cats={cats} onPrev={go(7)} onSubmit={startAnalysis} />
  ];
  const formBodyMinHeights = [654, 651, 685, 737, 566, 964, 714, 729, 964];
  const formBodyMinHeight = formBodyMinHeights[step] || 651;
  const stepLayoutMinHeight = Math.max(460, formBodyMinHeight - 106);

  return (
    <div className="min-h-screen bg-linear-to-b from-[#F1FFFC] via-[#F8FFFD] to-white flex flex-col">
      {isAnalyzing && <LoadingScreen onAnimationComplete={finishAnalysis} />}

      <div className={`flex-1 flex flex-col items-center px-4 pb-[360px] ${isAnalyzing ? "pt-[182px]" : "pt-[176px]"}`}>

        {/* 타이틀 */}
        <div className={`text-center ${isAnalyzing ? "mb-[316px]" : "mb-[125px]"}`}>
          <h1 className="text-[56px] font-bold leading-[1.15] text-[#4B4B4B] font-gmarket">
            내게 딱 맞는 <span className="text-[#03BFA5]">금융상품,</span>
            {!isAnalyzing && (
              <>
                <br />
                <span className="text-[#03BFA5]">Y-Fin</span>이 찾아줘요
              </>
            )}
          </h1>
          {!isAnalyzing && (
            <p className="text-[18px] text-[#A5A5A5] mt-[54px] leading-[1.7] font-gmarket">
              수백 개 은행 상품을 일일이 비교할 필요 없이, 키워드만 선택하면<br />
              최적의 상품을 찾을 수 있어요.
            </p>
          )}
        </div>

        {/* 검색바 + 폼 */}
        <div className={`w-full max-w-[1202px] bg-white shadow-[0_4px_40px_rgba(113,126,123,0.30)] ${
          isOpen ? "rounded-[28px] border border-[#E2E6E5]" : "rounded-full border-2 border-[#03BFA5]"
        }`}>

          {/* 검색바 */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            disabled={isAnalyzing}
            className={`w-full h-[84px] flex items-center justify-between px-[29px] hover:bg-gray-50 transition-colors focus:outline-none ${
              isOpen ? "rounded-t-[28px] rounded-b-none" : "rounded-full"
            }`}
          >
            {/* 왼쪽 돋보기 아이콘 */}
            <div className="flex items-center gap-3 text-[#AFC4BF] pl-1">
              <svg className="w-[43px] h-[43px] text-[#AFC4BF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </div>
            
            {/* 오른쪽 화살표 버튼 */}
            <div className="w-[55px] h-[55px] rounded-full bg-[#03BFA5] flex items-center justify-center shrink-0">
              <svg className="w-[23px] h-[23px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          {/* 폼 */}
          {isOpen && (
            <div
              className="px-[76px] pt-[60px] pb-[46px] border-t border-[#E2E6E5]"
              style={{
                minHeight: `${formBodyMinHeight}px`,
                "--step-layout-min-height": `${stepLayoutMinHeight}px`,
              }}
            >
              {!loading && steps[step]}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
