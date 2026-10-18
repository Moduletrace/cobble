import type { FeatureItem } from "@/src/types";
import FeatureCard from "./feature-card";

type Props = {
    items: FeatureItem[];
};

export default function FeatureGrid({ items }: Props) {
    return (
        <div className="grid w-full grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-px bg-slate-200 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-default-lg overflow-hidden">
            {items.map((item, index) => (
                <FeatureCard key={item.title} {...item} index={index} />
            ))}
        </div>
    );
}
