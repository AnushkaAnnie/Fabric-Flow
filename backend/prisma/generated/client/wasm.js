
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  username: 'username',
  passwordHash: 'passwordHash',
  role: 'role',
  createdAt: 'createdAt'
};

exports.Prisma.MillNameScalarFieldEnum = {
  id: 'id',
  name: 'name',
  address_line1: 'address_line1',
  address_line2: 'address_line2',
  address_line3: 'address_line3',
  state: 'state',
  pin_code: 'pin_code',
  gstn: 'gstn',
  email: 'email',
  createdAt: 'createdAt'
};

exports.Prisma.KnitterNameScalarFieldEnum = {
  id: 'id',
  name: 'name',
  address_line1: 'address_line1',
  address_line2: 'address_line2',
  address_line3: 'address_line3',
  state: 'state',
  pin_code: 'pin_code',
  gstn: 'gstn',
  email: 'email',
  yarn_balance: 'yarn_balance',
  createdAt: 'createdAt'
};

exports.Prisma.DyerNameScalarFieldEnum = {
  id: 'id',
  name: 'name',
  address_line1: 'address_line1',
  address_line2: 'address_line2',
  address_line3: 'address_line3',
  state: 'state',
  pin_code: 'pin_code',
  gstn: 'gstn',
  email: 'email',
  createdAt: 'createdAt'
};

exports.Prisma.CompacterNameScalarFieldEnum = {
  id: 'id',
  name: 'name',
  address_line1: 'address_line1',
  address_line2: 'address_line2',
  address_line3: 'address_line3',
  state: 'state',
  pin_code: 'pin_code',
  gstn: 'gstn',
  email: 'email',
  createdAt: 'createdAt'
};

exports.Prisma.ColourScalarFieldEnum = {
  id: 'id',
  name: 'name',
  createdAt: 'createdAt'
};

exports.Prisma.WashTypeScalarFieldEnum = {
  id: 'id',
  name: 'name',
  createdAt: 'createdAt'
};

exports.Prisma.FabricDescriptionScalarFieldEnum = {
  id: 'id',
  name: 'name',
  createdAt: 'createdAt'
};

exports.Prisma.YarnScalarFieldEnum = {
  id: 'id',
  hf_code: 'hf_code',
  purchase_order_no: 'purchase_order_no',
  invoice_no: 'invoice_no',
  delivery_to: 'delivery_to',
  status: 'status',
  mill_name_id: 'mill_name_id',
  description: 'description',
  count: 'count',
  quality: 'quality',
  no_of_bags: 'no_of_bags',
  bag_weight: 'bag_weight',
  total_weight: 'total_weight',
  available_weight: 'available_weight',
  rate_per_kg: 'rate_per_kg',
  total_cost: 'total_cost',
  issued_date: 'issued_date',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InhouseKnittedFabricScalarFieldEnum = {
  id: 'id',
  fabric_code: 'fabric_code',
  purchase_order_no: 'purchase_order_no',
  invoice_no: 'invoice_no',
  supplier_name_id: 'supplier_name_id',
  particulars: 'particulars',
  total_weight: 'total_weight',
  rate_per_unit: 'rate_per_unit',
  amount: 'amount',
  date: 'date',
  created_at: 'created_at'
};

exports.Prisma.KnittingYarnUsageScalarFieldEnum = {
  id: 'id',
  knitting_id: 'knitting_id',
  yarn_id: 'yarn_id',
  hf_code: 'hf_code',
  quantity: 'quantity',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.KnittingLotScalarFieldEnum = {
  id: 'id',
  knitting_id: 'knitting_id',
  lot_no: 'lot_no',
  job_work_no: 'job_work_no',
  no_of_rolls: 'no_of_rolls',
  dyer_name_id: 'dyer_name_id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.KnittingLotEntryScalarFieldEnum = {
  id: 'id',
  knitting_lot_id: 'knitting_lot_id',
  colour_id: 'colour_id',
  weight: 'weight',
  dyeing_id: 'dyeing_id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.KnittingScalarFieldEnum = {
  id: 'id',
  hf_code: 'hf_code',
  dc_no: 'dc_no',
  knitter_name_id: 'knitter_name_id',
  total_yarn_qty: 'total_yarn_qty',
  loop_length: 'loop_length',
  dia: 'dia',
  count: 'count',
  gauge: 'gauge',
  date_given: 'date_given',
  fabric_description_id: 'fabric_description_id',
  grey_fabric_weight: 'grey_fabric_weight',
  received_weight: 'received_weight',
  other_yarn_type: 'other_yarn_type',
  other_yarn_percentage: 'other_yarn_percentage',
  no_of_rolls: 'no_of_rolls',
  date: 'date',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.KnitterStockScalarFieldEnum = {
  id: 'id',
  knitterId: 'knitterId',
  yarnId: 'yarnId',
  received_weight: 'received_weight',
  remaining_weight: 'remaining_weight',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DeliveryNoteScalarFieldEnum = {
  id: 'id',
  sourceKnitterId: 'sourceKnitterId',
  destKnitterId: 'destKnitterId',
  yarnId: 'yarnId',
  quantity: 'quantity',
  transferDate: 'transferDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.KnitterProgramScalarFieldEnum = {
  id: 'id',
  knitterId: 'knitterId',
  yarnId: 'yarnId',
  quantity_used: 'quantity_used',
  grey_weight: 'grey_weight',
  number_of_rolls: 'number_of_rolls',
  gauge: 'gauge',
  loop_length: 'loop_length',
  productionDate: 'productionDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GreyFabricLotScalarFieldEnum = {
  id: 'id',
  knitterProgramId: 'knitterProgramId',
  grey_weight: 'grey_weight',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DyeingScalarFieldEnum = {
  id: 'id',
  lot_no: 'lot_no',
  hf_code: 'hf_code',
  source_type: 'source_type',
  fabric_code: 'fabric_code',
  count: 'count',
  initial_weight: 'initial_weight',
  gg: 'gg',
  initial_dia: 'initial_dia',
  final_dia: 'final_dia',
  no_of_rolls: 'no_of_rolls',
  final_weight: 'final_weight',
  process_loss: 'process_loss',
  date: 'date',
  knitterDcNo: 'knitterDcNo',
  companyDcNo: 'companyDcNo',
  compacterId: 'compacterId',
  greyFabricLotId: 'greyFabricLotId',
  colour_id: 'colour_id',
  dyer_name_id: 'dyer_name_id',
  wash_type_id: 'wash_type_id',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CompactingScalarFieldEnum = {
  id: 'id',
  hf_code: 'hf_code',
  count: 'count',
  lot_no: 'lot_no',
  initial_weight: 'initial_weight',
  compacter_name_id: 'compacter_name_id',
  final_dia: 'final_dia',
  colour_id: 'colour_id',
  final_weight: 'final_weight',
  process_loss: 'process_loss',
  date: 'date',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.YarnReceiptScalarFieldEnum = {
  id: 'id',
  yarnId: 'yarnId',
  quantity: 'quantity',
  receiptDate: 'receiptDate',
  dcNo: 'dcNo',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.GreyFabricScalarFieldEnum = {
  id: 'id',
  knittingId: 'knittingId',
  description: 'description',
  gauge: 'gauge',
  loopLength: 'loopLength',
  diameter: 'diameter',
  gsm: 'gsm',
  quantity: 'quantity',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DyeingOrderScalarFieldEnum = {
  id: 'id',
  dcNo: 'dcNo',
  dyerName: 'dyerName',
  issueDate: 'issueDate',
  notes: 'notes',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.DyeingLotScalarFieldEnum = {
  id: 'id',
  dyeingOrderId: 'dyeingOrderId',
  knittingId: 'knittingId',
  colour: 'colour',
  weight: 'weight',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  User: 'User',
  MillName: 'MillName',
  KnitterName: 'KnitterName',
  DyerName: 'DyerName',
  CompacterName: 'CompacterName',
  Colour: 'Colour',
  WashType: 'WashType',
  FabricDescription: 'FabricDescription',
  Yarn: 'Yarn',
  InhouseKnittedFabric: 'InhouseKnittedFabric',
  KnittingYarnUsage: 'KnittingYarnUsage',
  KnittingLot: 'KnittingLot',
  KnittingLotEntry: 'KnittingLotEntry',
  Knitting: 'Knitting',
  KnitterStock: 'KnitterStock',
  DeliveryNote: 'DeliveryNote',
  KnitterProgram: 'KnitterProgram',
  GreyFabricLot: 'GreyFabricLot',
  Dyeing: 'Dyeing',
  Compacting: 'Compacting',
  YarnReceipt: 'YarnReceipt',
  GreyFabric: 'GreyFabric',
  DyeingOrder: 'DyeingOrder',
  DyeingLot: 'DyeingLot'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
