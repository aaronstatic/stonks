type IconProps = {
    name: string;
    onClick?: () => void;
    className?: string;
    iconStyle?: string;
};

export default function Icon({ name, onClick, className, iconStyle = "outlined" }: IconProps) {
    if (!className) className = "icon";
    return (
        <div className={className + " material-symbols-" + iconStyle} onClick={onClick}>
            {name}
        </div>
    );
}