import { SVGProps } from "react";

export type OrnamentVariant = 'cross-divider' | 'flourish-simple' | 'flourish-complex' | 'diamond-divider';

interface OrnamentProps extends SVGProps<SVGSVGElement> {
    variant?: OrnamentVariant;
}

export const Ornament = ({ variant = 'flourish-simple', className, ...props }: OrnamentProps) => {
    const baseClass = "w-full max-w-[200px] h-auto mx-auto text-gold/60 my-6";
    const combinedClass = className ? `${baseClass} ${className}` : baseClass;

    switch (variant) {
        case 'cross-divider':
            return (
                <svg viewBox="0 0 100 20" fill="currentColor" className={combinedClass} {...props}>
                    <path d="M48 9V0h4v9h9v4h-9v9h-4v-9h-9V9h9z" />
                    <path d="M40 10h-30a2 2 0 0 1 0-4h30" opacity="0.5" />
                    <path d="M60 10h30a2 2 0 0 0 0-4h-30" opacity="0.5" />
                </svg>
            );

        case 'flourish-complex':
            return (
                <svg viewBox="0 0 200 30" fill="none" stroke="currentColor" strokeWidth="1.5" className={combinedClass} {...props}>
                    <path d="M100 15c-10 0-15-10-25-10s-20 10-30 10-15-10-25-10S0 15 0 15m100 0c10 0 15-10 25-10s20 10 30 10 15-10 25-10 20 10 20 10" />
                    <path d="M100 25c-5 0-8-5-15-5s-10 5-20 5-10-5-20-5m55 0c5 0 8-5 15-5s10 5 20 5 10-5 20-5" opacity="0.6" />
                </svg>
            );

        case 'diamond-divider':
            return (
                <svg viewBox="0 0 100 10" fill="currentColor" className={combinedClass} {...props}>
                    <rect x="48" y="0" width="4" height="4" transform="rotate(45 50 2)" />
                    <rect x="40" y="2" width="20" height="1" opacity="0.5" />
                    <rect x="30" y="2" width="2" height="1" opacity="0.3" />
                    <rect x="68" y="2" width="2" height="1" opacity="0.3" />
                </svg>
            );

        case 'flourish-simple':
        default:
            return (
                <svg viewBox="0 0 120 20" fill="none" stroke="currentColor" className={combinedClass} {...props}>
                    <path d="M60 10 C 40 10, 40 2, 20 2 C 10 2, 0 10, 0 10" />
                    <path d="M60 10 C 80 10, 80 2, 100 2 C 110 2, 120 10, 120 10" />
                    <circle cx="60" cy="15" r="2" fill="currentColor" stroke="none" />
                </svg>
            );
    }
};
