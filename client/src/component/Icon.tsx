type IconProps = {
    name: string;
    onClick?: () => void;
    className?: string;
    iconStyle?: string;
};

export default function Icon({ name, onClick, className, iconStyle = "outlined" }: IconProps) {
    return (
        <div className={className + " material-symbols-" + iconStyle} onClick={onClick}>
            {name}
        </div>
    );
}