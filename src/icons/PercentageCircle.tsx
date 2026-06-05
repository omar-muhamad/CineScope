const PercentageCircle = ({ rating }: { rating: number }) => {
  return (
    <div>
      <div className="relative w-10 h-10">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* <!-- Background circle --> */}
          <circle
            className="text-[#00000040] stroke-current"
            strokeWidth={10}
            cx={50}
            cy={50}
            r={40}
            fill="transparent"
          ></circle>
          {/* <!-- Progress circle --> */}
          <circle
            className="text-orange  progress-ring__circle stroke-current"
            strokeWidth={10}
            strokeLinecap="round"
            cx={50}
            cy={50}
            r={40}
            fill="transparent"
            strokeDasharray="251.2"
            strokeDashoffset={`calc(251.2 - (251.2 * ${rating}) / 100)`}
          ></circle>

          {/* <!-- Center text --> */}
          <text
            x={50}
            y={53}
            fontFamily="Verdana"
            fontSize={26}
            textAnchor="middle"
            alignmentBaseline="middle"
            className="fill-white"
          >
            {rating.toFixed(0)}
          </text>
        </svg>
      </div>
    </div>
  );
};
export default PercentageCircle;
