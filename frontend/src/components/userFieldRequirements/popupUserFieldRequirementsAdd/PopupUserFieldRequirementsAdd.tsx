import styles from './Popup.module.css';
import type { Role } from "../../../services/roles";
import { CgClose } from 'react-icons/cg';
import { useAll } from "../../../context/AllContext";
import { useEffect, useState } from 'react';
import { AiOutlinePlus, AiOutlineDelete } from 'react-icons/ai';
import type { FieldCreateInput, FieldUpdateInput } from '../../../services/users';

interface Props {
    role: Role | null;
    setAddFields: (value: boolean) => void;
    fieldId?: number;
}

interface ValidatorInput {
    name: string;
    type: string;
    value: any;
}

export default function PopupUserFieldRequirementsAdd({ role, setAddFields, fieldId }: Props) {
    const { roles, requiredFieldsForUser } = useAll();

    const [fieldTypes, setFieldTypes] = useState<string[]>([]);
    const [selectedField, setSelectedField] = useState<string>('');
    const [validators, setValidators] = useState<Record<string, string>>({});
    const [selectedValidators, setSelectedValidators] = useState<ValidatorInput[]>([]);
    const [fieldName, setFieldName] = useState("");


    const [options, setOptions] = useState<Record<string, string>>({});
    const [answer, setAnswer] = useState<string | null>(null); // MCQ
    const [answers, setAnswers] = useState<string[]>([]); // MSQ

    const [isRequired, setIsRequired] = useState(false);
    const [filledBy, setFilledBy] = useState<string>('');
    const [editedBy, setEditedBy] = useState<string>('');
    const [displayOrder, setDisplayOrder] = useState<number>(0);


    const isMCQorMSQ = selectedField === 'mcq' || selectedField === 'msq';

    // Load field types
    useEffect(() => {
        (async () => {
            const types = await requiredFieldsForUser.getFieldTypes();
            setFieldTypes(types);
        })();
    }, []);

    // Load validators on field type change
    useEffect(() => {
        if (!selectedField) {
            setValidators({});
            setSelectedValidators([]);
            setOptions({});
            setAnswer(null);
            setAnswers([]);
            return;
        }

        (async () => {
            const validatorsObj = await requiredFieldsForUser.getValidatorsByType(selectedField);
            setValidators(validatorsObj);
            setSelectedValidators([]);
            setOptions({});
            setAnswer(null);
            setAnswers([]);
        })();
    }, [selectedField]);

    // Validators
    const handleCheckboxChange = (validatorName: string) => {
        const isSelected = selectedValidators.find(v => v.name === validatorName);
        if (isSelected) {
            setSelectedValidators(prev => prev.filter(v => v.name !== validatorName));
        } else {
            setSelectedValidators(prev => [
                ...prev,
                { name: validatorName, type: validators[validatorName], value: '' },
            ]);
        }
    };

    const handleInputChange = (validatorName: string, value: any) => {
        setSelectedValidators(prev =>
            prev.map(v => (v.name === validatorName ? { ...v, value } : v))
        );
    };

    // Options management
    const addOption = () => {
        const key = String.fromCharCode(97 + Object.keys(options).length); // a, b, c...
        setOptions(prev => ({ ...prev, [key]: '' }));
    };

    const updateOption = (key: string, value: string) => {
        setOptions(prev => ({ ...prev, [key]: value }));
    };

    const deleteOption = (key: string) => {
        const newOptions = { ...options };
        delete newOptions[key];
        setOptions(newOptions);

        if (answer === key) setAnswer(null);
        setAnswers(prev => prev.filter(k => k !== key));
    };

    const toggleCorrect = (key: string) => {
        if (selectedField === 'mcq') {
            setAnswer(prev => (prev === key ? null : key));
        } else if (selectedField === 'msq') {
            setAnswers(prev =>
                prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
            );
        }
    };

    const getInputType = (val: string) => {
        const validTypes = ['text', 'date', 'number'];
        return validTypes.includes(val) ? val : 'text';
    };

    const formatLabel = (name: string) => name.replace(/_/g, ' ');

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (!role) return;

        // -------------------------------
        // SHARED PAYLOAD (base structure)
        // -------------------------------
        const basePayload = {
            field_name: fieldName.trim(),
            field_type: selectedField,
            is_required: isRequired,
            filled_by_role_id: filledBy ? Number(filledBy) : undefined,
            editable_by_role_id: editedBy ? Number(editedBy) : undefined,
            display_order: displayOrder,
            is_active: true,
        };

        // -------------------------------
        // OPTIONS (MCQ/MSQ)
        // -------------------------------
        let optionsPayload;
        if (isMCQorMSQ) {
            optionsPayload = Object.entries(options).map(([key, label]) => ({
                label,
                is_correct:
                    selectedField === "mcq"
                        ? answer === key
                        : answers.includes(key)
                            ? true
                            : null,
            }));
        }

        // -------------------------------
        // VALIDATION
        // -------------------------------
        let validationPayload: Record<string, any> | undefined = undefined;
        if (selectedValidators.length > 0) {
            validationPayload = {};
            const numericValidators = ['min_length', 'max_length', 'min_value', 'max_value'];

            selectedValidators.forEach((v) => {
                if (numericValidators.includes(v.name)) {
                    validationPayload![v.name] = Number(v.value);
                } else if (v.name === "allowed_extensions") {
                    validationPayload![v.name] = Array.from(
                        new Set(
                            v.value
                                .split(",")
                                .map((ext: string) => ext.trim())
                                .filter(Boolean)
                        )
                    );
                } else if (v.name === "max_size_mb") {
                    validationPayload![v.name] = parseInt(v.value, 10);
                } else {
                    validationPayload![v.name] = v.value;
                }
            });
        }

        // -------------------------------
        // UPDATE MODE
        // -------------------------------
        if (fieldId) {
            const updatePayload: FieldUpdateInput = {
                ...basePayload,
                options: optionsPayload,
                validation: validationPayload,
            };

            try {
                await requiredFieldsForUser.updateField(fieldId, updatePayload);
                setAddFields(false);
                requiredFieldsForUser.getFieldsByRole(role.id);
            } catch (err) {
                console.error("Failed to update field:", err);
            }
            return; // ⬅ STOP HERE (do not run create mode)
        }

        // -------------------------------
        // CREATE MODE
        // -------------------------------
        const createPayload: FieldCreateInput = {
            ...basePayload,
            role_id: role.id,
            options: optionsPayload,
            validation: validationPayload,
        };

        try {
            await requiredFieldsForUser.createField(createPayload);
            setAddFields(false);
            requiredFieldsForUser.getFieldsByRole(role.id);
        } catch (err) {
            console.error("Failed to create field:", err);
        }
    };


    useEffect(() => {
        if (!fieldId) return;

        // get existing field details
        const field = requiredFieldsForUser.fields.find(f => f.Id === fieldId);
        if (!field) return;

        // prefill inputs
        setFieldName(field.FieldName);
        setSelectedField(field.FieldType);
        setIsRequired(field.IsRequired);
        setFilledBy(field.FilledByRoleId?.toString() || '');
        setEditedBy(field.EditableByRoleId?.toString() || '');
        setDisplayOrder(field.DisplayOrder || 0);

        // If MCQ/MSQ → map options
        if (field.Options) {
            let mapped: Record<string, string> = {};
            let answerSingle: string | null = null;
            let answerMulti: string[] = [];

            field.Options.forEach((opt: any, idx: number) => {
                const key = String.fromCharCode(97 + idx);
                mapped[key] = opt.Label;

                if (field.FieldType === "mcq" && opt.IsCorrect) {
                    answerSingle = key;
                }
                if (field.FieldType === "msq" && opt.IsCorrect) {
                    answerMulti.push(key);
                }
            });

            setOptions(mapped);
            setAnswer(answerSingle);
            setAnswers(answerMulti);
        }

        // validators
        if (field.Validation) {
            const vals = Object.entries(field.Validation).map(([name, value]) => ({
                name,
                type: validators[name] || 'text',
                value
            }));
            setSelectedValidators(vals);
        }

    }, [fieldId, validators]);


    return (
        <div className={styles.popupCont}>
            <CgClose onClick={() => setAddFields(false)} className={styles.closeIcon} />
            <h3 className={styles.title}>{role?.name}</h3>

            <form className={styles.form} onSubmit={handleSubmit}>
                <input type="text" placeholder="Field name" className={styles.input} required value={fieldName} onChange={(e) => setFieldName(e.target.value)} />

                <select value={selectedField} onChange={e => setSelectedField(e.target.value)} className={styles.select}>
                    <option value="" disabled>Select field type</option>
                    {fieldTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>

                {isMCQorMSQ && (
                    <div className={styles.optionsContainer}>
                        <h4 className={styles.subTitle}>Options:</h4>
                        {Object.entries(options).map(([key, value]) => (
                            <div key={key} className={styles.optionRow}>
                                <input
                                    type="text"
                                    placeholder={`Option ${key.toUpperCase()}`}
                                    value={value}
                                    onChange={e => updateOption(key, e.target.value)}
                                    className={styles.input}
                                />
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={selectedField === 'mcq' ? answer === key : answers.includes(key)}
                                        onChange={() => toggleCorrect(key)}
                                    />
                                    <span>Correct</span>
                                </label>
                                <button type="button" onClick={() => deleteOption(key)} className={styles.deleteBtn}>
                                    <AiOutlineDelete size={20} />
                                </button>
                            </div>
                        ))}
                        <button type="button" onClick={addOption} className={styles.addOptionBtn}>
                            <AiOutlinePlus /> Add Option
                        </button>
                    </div>
                )}

                <div className={styles.validatorsContainer}>
                    {Object.keys(validators).map(validatorName => (
                        <div key={validatorName} className={styles.validatorRow}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={!!selectedValidators.find(v => v.name === validatorName)}
                                    onChange={() => handleCheckboxChange(validatorName)}
                                />
                                <span>{formatLabel(validatorName)}</span>
                            </label>
                            {selectedValidators.find(v => v.name === validatorName) && (
                                <input
                                    type={getInputType(validators[validatorName])}
                                    value={selectedValidators.find(v => v.name === validatorName)?.value || ''}
                                    onChange={e => handleInputChange(validatorName, e.target.value)}
                                    placeholder={`Enter ${formatLabel(validatorName)}`}
                                    className={styles.input}
                                />
                            )}
                        </div>
                    ))}
                </div>

                <div className={styles.checkboxRow}>
                    <label>Required to be filled:</label>
                    <input type="checkbox" checked={isRequired} onChange={e => setIsRequired(e.target.checked)} />
                </div>

                <div className={styles.selectGroup}>
                    <label>Must be filled by:</label>
                    <select value={filledBy} onChange={e => setFilledBy(e.target.value)} className={styles.select}>
                        <option value="">Select a role</option>
                        {roles.roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>

                <div className={styles.selectGroup}>
                    <label>Must be edited by:</label>
                    <select value={editedBy} onChange={e => setEditedBy(e.target.value)} className={styles.select}>
                        <option value="">Select a role</option>
                        {roles.roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>

                <input
                    type="number"
                    value={displayOrder}
                    onChange={e => setDisplayOrder(Number(e.target.value))}
                    placeholder="Display order"
                    className={styles.input}
                    min={0}
                />

                <button type="submit" className={styles.submitBtn}>Add Field</button>
            </form>
        </div>
    );
}
