import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Rating",
  description:
    "Collect and show ratings. Rating is a star rating (read only average or input, half stars). NpsScale is the 0 to 10 Net Promoter question with band colours. SentimentRating is one-tap feedback as thumbs or five faces. RatingSummary is the average with a 5 to 1 breakdown, optionally filterable.",
  features: [
    "Rating: max, precision full or half, fractional display (4.6 fills 60% of the fifth star), readOnly, showValue, count, tone accent | warning | success, sizes sm | md | lg",
    "NpsScale: 0 to 10, detractor / passive / promoter colours, lowLabel and highLabel, and calculateNps(scores) for the score",
    "SentimentRating: variant thumbs (1 up, -1 down) or faces (1 to 5)",
    "RatingSummary: counts per star level (1 star first), derived average and total, optional onSelect to filter reviews",
    "All inputs are controlled (value, onValueChange) or uncontrolled (defaultValue)",
  ],
  accessibility: [
    "Rating read only is role=img labelled '4.5 out of 5'; interactive is a single slider with aria-valuenow and aria-valuetext",
    "NpsScale and SentimentRating are radiogroups with a roving tab stop and arrow-key selection",
    "Colour is never the only signal: values, labels and numbers are always in text",
  ],
  keyboard: "Rating: Arrow keys change the value by the step, Home sets 0, End sets max. NpsScale: Arrow keys move, Home is 0, End is 10. SentimentRating: Arrow keys move between options.",
  usage: {
    bestPractices: [
      { guidance: true, description: "Use Rating readOnly with `value`, `showValue` and `count` on product cards and review lists." },
      { guidance: true, description: "Pass raw counts to RatingSummary and let it compute the average, so the number and the bars never disagree." },
      { guidance: false, description: "Do not build stars from Icon by hand; Rating handles fractions, hover and keyboard." },
      { guidance: false, description: "Do not use NpsScale for satisfaction questions. NPS is the 0 to 10 recommend question; use Rating or SentimentRating otherwise." },
    ],
  },
  examples: [
    { title: "Average on a product", code: '<Rating readOnly value={4.6} showValue count={34} />' },
    { title: "Collect a rating with half stars", code: '<Rating precision="half" size="lg" onValueChange={(v) => save(v)} />' },
    { title: "NPS question", code: '<NpsScale lowLabel="Not likely" highLabel="Very likely" onValueChange={(n) => send(n)} />' },
    { title: "Thumbs feedback", code: '<SentimentRating onValueChange={(v) => save(v)} />' },
    { title: "Review summary", code: '<RatingSummary counts={[2, 1, 4, 20, 55]} noun="reviews" />' },
  ],
};
