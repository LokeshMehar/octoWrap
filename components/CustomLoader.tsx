import { cn } from "@/lib/utils";

type ICustomLoaderProps = {
  className?: string;
};

const CustomLoader = ({ className }: ICustomLoaderProps) => {
  return (
    <span
      className={cn(
        "ml-1.5 flex items-center gap-1 [&>span]:bg-white",
        className
      )}
    >
      <span className="animate-flashing w-1 h-1 rounded-full inline-block" />
      <span className="animate-flashing delay-100 w-1 h-1 rounded-full inline-block" />
      <span className="animate-flashing delay-200 w-1 h-1 rounded-full inline-block" />
    </span>
  );
};

export default CustomLoader;
