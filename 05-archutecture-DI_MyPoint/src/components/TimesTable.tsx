import { useMemo, useState, type ChangeEvent } from "react";
import useStore from "../store/useStore";
import type { IRecord } from "../types";
import { renderDaysOfMonth } from "../utils";

export default function TimesTable() {
  const store = useStore();

  const currentDaysOfMonth = useMemo<string[]>(() => {
    const { inputYear, inputMonth } = store.state;

    return renderDaysOfMonth(inputYear, inputMonth);
  }, [store]);

  const currentRecords = useMemo<Record<string, IRecord>>(() => {
    const { inputYear, inputMonth, timeRecords } = store.state;

    const recordsOfMonth = timeRecords.filter(
      ({ year, month }) => inputYear === year && inputMonth === month
    );

    return recordsOfMonth.reduce((obj, record) => {
      obj[record.day] = record;
      return obj;
    }, {} as Record<string, IRecord>);
  }, [store]);

  return (
    <div className="app-card w-full overflow-hidden">
      <h2 className="app-card-title app-card-title__border">
        Registros do mês
      </h2>

      <div className="table-container">
        <table className="">
          <thead>
            <tr>
              <th className="min-w-[50px]">Dia</th>
              <th className="min-w-[75px]">Entrada 1</th>
              <th className="min-w-[75px]">Saída 1</th>
              <th className="min-w-[75px]">Entrada 2</th>
              <th className="min-w-[75px]">Saída 2</th>
              <th className="min-w-[75px]">Total</th>
              <th className="min-w-[75px]">Extra</th>
            </tr>
          </thead>
          <tbody>
            {currentDaysOfMonth.map((daysOfMonth) => (
              <RowRecord
                key={`${store.state.inputYear}-${store.state.inputMonth}-${daysOfMonth}`}
                daysOfMonth={daysOfMonth}
                record={currentRecords[daysOfMonth]}
                // updateRecord={updateRecord}
              />
            ))}

            {/* {currentRecords.map((record, index) => (
              // <tr key={index}>
              //   <td>
              //     <div>{record?.day ?? "N-D"}</div>
              //   </td>
              //   <td>
              //     <div>{record.entry1}</div>
              //   </td>
              //   <td>
              //     <div>{record.exit1}</div>
              //   </td>
              //   <td>
              //     <div>{record.entry2}</div>
              //   </td>
              //   <td>
              //     <div>{record.exit2}</div>
              //   </td>
              //   <td>
              //     <div>{record.total}</div>
              //   </td>
              //   <td>
              //     <div>{record.extra}</div>
              //   </td>
              // </tr>
              <RowRecord
                key={`${record?._key}-${index}`}
                record={record}
                // updateRecord={updateRecord}
              />
            ))} */}
            {/*
             */}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const RowRecord = (props: { daysOfMonth: string; record: IRecord | null }) => {
  type IData = {
    edit: boolean;
    record: Partial<IRecord>;
  };
  const [data, setData] = useState<IData>({
    edit: false,
    record: { ...props.record },
  });

  const setValue = (key: string, value: string) => {
    setData((prev) => ({ ...prev, record: { ...prev.record, [key]: value } }));
  };

  return (
    <tr
      onDoubleClick={() => {
        setData({ ...data, edit: !data.edit });
        if (data.edit) {
          // props.updateRecord(data.record);
        }
      }}
    >
      <td width={100}>
        <span>{props.daysOfMonth ?? "N-D"}</span>
      </td>
      <td width={100}>
        <RowCellValue
          edit={data.edit}
          value={data.record?.entry1 ?? "-"}
          onChange={({ target }) => setValue("entry1", target.value)}
        />
      </td>
      <td width={100}>
        <RowCellValue
          edit={data.edit}
          value={data.record?.exit1 ?? "-"}
          onChange={({ target }) => setValue("exit1", target.value)}
        />
      </td>
      <td width={100}>
        <RowCellValue
          edit={data.edit}
          value={data.record?.entry2 ?? "-"}
          onChange={({ target }) => setValue("entry2", target.value)}
        />
      </td>
      <td width={100}>
        <RowCellValue
          edit={data.edit}
          value={data.record?.exit2 ?? "-"}
          onChange={({ target }) => setValue("exit2", target.value)}
        />
      </td>
      <td width={100}>
        <span>{data.record?.total ?? "-"}</span>
      </td>
      <td width={100}>
        <span>{data.record?.extra ?? "-"}</span>
      </td>
    </tr>
  );
};

const RowCellValue = ({
  edit,
  ...rest
}: {
  edit: boolean;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) => {
  return (
    <>
      {/* {rest.value} */}
      {edit ? (
        <input
          {...rest}
          type="time"
          // className="block h-[32px] w-full  min-w-10 max-w-48 text-center"
        />
      ) : (
        <span
        // className="block w-full h-[32px] min-w-10 max-w-48 text-center"
        >
          {rest.value}
        </span>
      )}
    </>
  );
};
