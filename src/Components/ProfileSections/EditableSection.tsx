import React from "react";

interface EditableSectionProps {
  title: string;
  icon: string | React.ReactElement;
  children: React.ReactNode;
  isEditing: boolean;
  onAdd: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  headerButtons?: React.ReactNode;
}

const EditableSection: React.FC<EditableSectionProps> = ({
  title,
  icon,
  children,
  isEditing,
  onAdd,
  onEdit,
  onSave,
  onCancel,
  headerButtons
}) => (
  <div className="w-full bg-white border-2 border-gray-300 rounded-[25px] overflow-hidden p-4 flex flex-col items-start gap-3 shadow-sm">
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {typeof icon === 'string' ? (
          <img src={icon} alt={`${title} icon`} className="w-[20px] h-[20px]" />
        ) : (
          <div className="w-[20px] h-[20px] flex items-center justify-center">
            {icon}
          </div>
        )}
        <h2 className="text-[18px] font-bold">{title}</h2>
      </div>
      <div className="flex gap-2 items-center flex-shrink-0 pr-1">
        {headerButtons}
        {!isEditing ? (
            <button
              onClick={onEdit}
              className="w-[30px] h-[24px] bg-purple-200 rounded-full flex items-center justify-center hover:bg-purple-300 transition-colors"
            >
              <span className="text-purple-700 text-xs">✏️</span>
            </button>
        ) : (
          <>
            <button
              onClick={onCancel}
              className="w-[24px] h-[24px] bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
            >
              <span className="text-gray-600 text-xs">✕</span>
            </button>
            <button
              onClick={onSave}
              className="w-[24px] h-[24px] bg-green-200 rounded-full flex items-center justify-center hover:bg-green-300 transition-colors"
            >
              <span className="text-green-600 text-xs">✓</span>
            </button>
          </>
        )}
      </div>
    </div>
    <div className="w-full space-y-3">
      {/* Render content except headerButtons prop */}
      {children && (children as any).props && (children as any).props.headerButtons ? (children as any).props.children : children}
    </div>
  </div>
);

export default EditableSection; 