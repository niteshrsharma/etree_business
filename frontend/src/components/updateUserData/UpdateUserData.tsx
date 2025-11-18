import { useEffect, useState } from "react";
import { useAll } from "../../context/AllContext";
import { useLoader } from "../../common/Loader";
import { toast } from "react-hot-toast";
import styles from "./UpdateUserData.module.css";

interface FieldOption {
  label: string;
  value?: string;
}

export default function UpdateUserData() {
  const { user: userContext } = useAll();
  const {
    fields,
    loadFields,
    updateField,
    uploadDocument,
    deleteDocument,
    downloadDocument,
  } = userContext;

  const showLoader = useLoader();

  const [localValues, setLocalValues] = useState<Record<number, any>>({});

  /** Load fields on mount */
  useEffect(() => {
    const init = async () => {
      showLoader(true);
      try {
        await loadFields();
      } catch {
        toast.error("Failed to load user data");
      } finally {
        showLoader(false);
      }
    };
    init();
  }, []);

  /** Sync values once fields arrive */
  useEffect(() => {
    const map: Record<number, any> = {};
    fields.forEach((f) => (map[f.field_id] = f.value ?? ""));
    setLocalValues(map);
  }, [fields]);

  /** Update local field value */
  const handleChange = (fieldId: number, value: any) => {
    setLocalValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  /** Save field */
  const handleSave = async (fieldId: number) => {
    showLoader(true);
    try {
      await updateField(fieldId, localValues[fieldId]);
    } finally {
      showLoader(false);
    }
  };

  /** Upload file */
  const handleUpload = async (fieldId: number, file: File) => {
    showLoader(true);
    try {
      await uploadDocument(fieldId, file);
    } finally {
      showLoader(false);
    }
  };

  return (
    <>
      <h1 className={styles.title}>Update Your Information</h1>

      <div className={styles.container}>
        {fields.map((field) => (
          <div key={field.field_id} className={styles.fieldBox}>
            <label className={styles.label}>{field.field_name}</label>

            {/* TEXT / NUMBER / DATE */}
            {["text", "number", "date"].includes(field.field_type) && (
              <input
                type={field.field_type}
                className={styles.input}
                value={localValues[field.field_id] || ""}
                onChange={(e) =>
                  handleChange(field.field_id, e.target.value)
                }
              />
            )}

            {/* MCQ */}
            {field.field_type === "mcq" && (
              <select
                className={styles.input}
                value={localValues[field.field_id] || ""}
                onChange={(e) =>
                  handleChange(field.field_id, e.target.value)
                }
              >
                <option value="">-- choose an option --</option>

                {(field.options ?? []).map(
                  (opt: FieldOption, i: number) => (
                    <option key={i} value={opt.label}>
                      {opt.label}
                    </option>
                  )
                )}
              </select>
            )}

            {/* MSQ */}
            {field.field_type === "msq" && (
              <div className={styles.checkboxGroup}>
                {(field.options ?? []).map(
                  (opt: FieldOption, i: number) => {
                    const isChecked = Array.isArray(
                      localValues[field.field_id]
                    )
                      ? localValues[field.field_id].includes(opt.label)
                      : false;

                    return (
                      <label key={i} className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const prev = Array.isArray(
                              localValues[field.field_id]
                            )
                              ? localValues[field.field_id]
                              : [];

                            const updated = e.target.checked
                              ? [...prev, opt.label]
                              : prev.filter(
                                (v: string) => v !== opt.label
                              );

                            handleChange(field.field_id, updated);
                          }}
                        />
                        {opt.label}
                      </label>
                    );
                  }
                )}
              </div>
            )}

            {/* DOCUMENT */}
            {field.field_type === "document" && (
              <div className={styles.docBox}>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleUpload(field.field_id, e.target.files[0]);
                    }
                  }}
                />

                {field.filled && field.value?.name && (
                  <div className={styles.docBtns}>
                    <button
                      type="button"
                      className={styles.btnBlue}
                      onClick={() =>
                        downloadDocument(field.field_id)
                      }
                    >
                      Download
                    </button>

                    <button
                      type="button"
                      className={styles.btnRed}
                      onClick={() =>
                        deleteDocument(field.field_id)
                      }
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* SAVE BUTTON for non-document fields */}
            {field.field_type !== "document" && (
              <button
                type="button"
                className={styles.saveBtn}
                onClick={() => handleSave(field.field_id)}
              >
                Save
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
