# Giải thích chi tiết hàm CreateOrderAsync

## Tổng quan
Hàm `CreateOrderAsync` được gọi khi người dùng nhấn nút "Thanh toán" ở trang Cart. Hàm này tạo một đơn hàng (Order) mới với các chi tiết đơn hàng (OrderDetails) và trả về thông tin đơn hàng đã tạo.

---

## Giải thích từng dòng code

### Dòng 76: Khai báo hàm
```csharp
public async Task<OrderViewDto> CreateOrderAsync(CreateOrderDto input)
```
- **`public`**: Hàm công khai, có thể gọi từ bên ngoài
- **`async Task<OrderViewDto>`**: Hàm bất đồng bộ, trả về `OrderViewDto` (thông tin đơn hàng)
- **`CreateOrderDto input`**: Tham số đầu vào chứa danh sách các dịch vụ muốn mua

### Dòng 78-79: Khối try-catch
```csharp
try
{
```
- Bắt đầu khối try để bắt các exception có thể xảy ra

### Dòng 80: Kiểm tra user đã đăng nhập
```csharp
if (!_currentUser.Id.HasValue) throw new UserFriendlyException("User not authenticated");
```
- **`_currentUser.Id.HasValue`**: Kiểm tra user hiện tại có ID không (đã đăng nhập chưa)
- **`!`**: Phủ định - nếu không có ID
- **`throw new UserFriendlyException(...)`**: Ném exception thân thiện với người dùng
- **Mục đích**: Đảm bảo chỉ user đã đăng nhập mới có thể tạo order

### Dòng 82: Kiểm tra input hợp lệ
```csharp
if (input == null || input.OrderDetails == null || input.OrderDetails.Count == 0) throw new UserFriendlyException("Order details cannot be empty");
```
- **`input == null`**: Kiểm tra input có null không
- **`input.OrderDetails == null`**: Kiểm tra danh sách chi tiết có null không
- **`input.OrderDetails.Count == 0`**: Kiểm tra danh sách có rỗng không
- **`||`**: Toán tử OR - nếu một trong các điều kiện đúng thì throw exception
- **Mục đích**: Đảm bảo phải có ít nhất 1 sản phẩm trong đơn hàng

### Dòng 84: Lấy UserId
```csharp
var userId = _currentUser.Id.Value;
```
- **`_currentUser.Id.Value`**: Lấy giá trị ID của user hiện tại (đã kiểm tra ở dòng 80 nên chắc chắn có giá trị)
- **`var userId`**: Lưu vào biến để dùng sau

### Dòng 86: Khởi tạo danh sách OrderDetails
```csharp
var orderDetails = new List<Models.Order.OrderDetail>();
```
- Tạo danh sách rỗng để lưu các chi tiết đơn hàng (mỗi sản phẩm = 1 OrderDetail)

### Dòng 87: Khởi tạo biến tổng tiền
```csharp
decimal subTotal = 0;
```
- **`decimal`**: Kiểu dữ liệu cho số tiền (chính xác hơn float/double)
- **`subTotal`**: Tổng tiền chưa VAT, khởi tạo = 0

### Dòng 89: Vòng lặp qua từng sản phẩm
```csharp
foreach (var detailDto in input.OrderDetails)
{
```
- **`foreach`**: Duyệt qua từng phần tử trong danh sách `input.OrderDetails`
- **`var detailDto`**: Mỗi phần tử là một `CreateOrderDetailDto` chứa thông tin sản phẩm muốn mua

### Dòng 91: Kiểm tra SubscriptionServiceId hợp lệ
```csharp
if (detailDto.SubcriptionServiceId == Guid.Empty) throw new UserFriendlyException("Invalid subscription service ID");
```
- **`Guid.Empty`**: Giá trị Guid rỗng (00000000-0000-0000-0000-000000000000)
- **Mục đích**: Đảm bảo mỗi sản phẩm phải có ID hợp lệ

### Dòng 92: Kiểm tra số lượng hợp lệ
```csharp
if (detailDto.Quantity <= 0) throw new UserFriendlyException("Quantity must be greater than 0");
```
- **`Quantity <= 0`**: Số lượng phải lớn hơn 0
- **Mục đích**: Không cho phép mua 0 hoặc số âm sản phẩm

### Dòng 94-97: Kiểm tra lại số lượng (code trùng lặp)
```csharp
if (detailDto.Quantity <= 0)
{
    throw new UserFriendlyException("Quantity must be greater than 0");
}
```
- **Lưu ý**: Đoạn code này trùng với dòng 92, có thể là code thừa

### Dòng 99: Lấy thông tin dịch vụ từ database
```csharp
var subscriptionService = await _subcriptionServiceRepository.GetAsync(detailDto.SubcriptionServiceId);
```
- **`await`**: Đợi kết quả từ database (bất đồng bộ)
- **`_subcriptionServiceRepository.GetAsync(...)`**: Lấy thông tin dịch vụ theo ID
- **Kết quả**: Trả về object `SubcriptionService` hoặc null nếu không tìm thấy

### Dòng 101: Kiểm tra dịch vụ có tồn tại
```csharp
if (subscriptionService == null) throw new UserFriendlyException($"Subscription service not found: {detailDto.SubcriptionServiceId}");
```
- **`== null`**: Kiểm tra dịch vụ không tồn tại
- **`$"..."`**: String interpolation - chèn giá trị vào chuỗi
- **Mục đích**: Đảm bảo dịch vụ phải tồn tại trong hệ thống

### Dòng 102: Kiểm tra dịch vụ có đang active
```csharp
if (!subscriptionService.IsActive) throw new UserFriendlyException($"Subscription service {subscriptionService.Title} is not active");
```
- **`!subscriptionService.IsActive`**: Kiểm tra dịch vụ không active (IsActive = false)
- **Mục đích**: Chỉ cho phép mua dịch vụ đang hoạt động

### Dòng 104: Lấy giá hiện tại của dịch vụ
```csharp
var unitPrice = await _subcriptionPriceService.GetCurrentPriceOfSubcription(detailDto.SubcriptionServiceId);
```
- **`GetCurrentPriceOfSubcription(...)`**: Lấy giá hiện tại (có thể thay đổi theo thời gian)
- **Mục đích**: Đảm bảo lấy đúng giá tại thời điểm mua, không dùng giá cũ

### Dòng 105: Tính tổng tiền cho sản phẩm này
```csharp
var totalPrice = unitPrice * detailDto.Quantity;
```
- **Công thức**: Đơn giá × Số lượng = Tổng tiền
- **Ví dụ**: 100,000 VNĐ × 2 = 200,000 VNĐ

### Dòng 107-113: Tạo object OrderDetail
```csharp
var orderDetail = new Models.Order.OrderDetail
{
    SubcriptionServiceId = detailDto.SubcriptionServiceId,
    Quantity = detailDto.Quantity,
    UnitPrice = unitPrice,
    TotalPrice = totalPrice
};
```
- **`new Models.Order.OrderDetail`**: Tạo object mới
- **`SubcriptionServiceId`**: ID dịch vụ
- **`Quantity`**: Số lượng mua
- **`UnitPrice`**: Đơn giá tại thời điểm mua
- **`TotalPrice`**: Tổng tiền = UnitPrice × Quantity
- **Lưu ý**: Chưa có `OrderId` vì Order chưa được tạo

### Dòng 115: Thêm vào danh sách
```csharp
orderDetails.Add(orderDetail);
```
- Thêm OrderDetail vừa tạo vào danh sách `orderDetails`

### Dòng 116: Cộng dồn vào tổng tiền
```csharp
subTotal += totalPrice;
```
- **`+=`**: Toán tử cộng và gán
- **Mục đích**: Cộng dồn tổng tiền của tất cả sản phẩm

### Dòng 119-122: Tính VAT và discount (đã comment)
```csharp
// Calculate VAT and total
//var vatAmount = subTotal * VAT_RATE;
//decimal? discountAmount = input.DiscountCode != null ? 0 : null; // TODO: Implement discount logic
//var totalAmount = subTotal + vatAmount - (discountAmount ?? 0);
```
- **Đã bị comment**: Code tính VAT và discount chưa được sử dụng
- **`VAT_RATE = 0.08m`**: 8% VAT (đã định nghĩa ở đầu class)
- **Hiện tại**: VAT = 0, discount = 0

### Dòng 125: Tạo mã đơn hàng
```csharp
var orderCode = $"ORD-{DateTime.Now:yyyyMMddHHmmss}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
```
- **`ORD-`**: Prefix cố định
- **`DateTime.Now:yyyyMMddHHmmss`**: Ngày giờ hiện tại (VD: 20241225143025)
- **`Guid.NewGuid().ToString().Substring(0, 8).ToUpper()`**: 8 ký tự ngẫu nhiên viết hoa
- **Kết quả**: `ORD-20241225143025-A1B2C3D4`
- **Mục đích**: Mã đơn hàng duy nhất, dễ đọc

### Dòng 128-142: Tạo object Order
```csharp
var order = new Models.Order.Order
{
    UserId = userId,
    OrderCode = orderCode,
    SubTotal = subTotal,
    VATAmount = 0,
    TotalAmount = subTotal,
    DiscountCode = input.DiscountCode,
    DiscountAmount = 0,
    Status = OrderStatus.Pending,
    PaymentStatus = PaymentStatus.Pending,
    PaymentMethod = PaymentMethod.VNPay,
    Notes = input.Notes,
    PaidAt = DateTime.UtcNow
};
```
- **`UserId`**: ID người mua
- **`OrderCode`**: Mã đơn hàng vừa tạo
- **`SubTotal`**: Tổng tiền chưa VAT
- **`VATAmount = 0`**: VAT = 0 (chưa tính)
- **`TotalAmount = subTotal`**: Tổng tiền = SubTotal (vì VAT = 0)
- **`DiscountCode`**: Mã giảm giá (nếu có)
- **`DiscountAmount = 0`**: Số tiền giảm = 0
- **`Status = OrderStatus.Pending`**: Trạng thái đơn hàng = Đang chờ
- **`PaymentStatus = PaymentStatus.Pending`**: Trạng thái thanh toán = Chưa thanh toán
- **`PaymentMethod = PaymentMethod.VNPay`**: Phương thức thanh toán = VNPay
- **`Notes`**: Ghi chú từ người dùng
- **`PaidAt = DateTime.UtcNow`**: Thời gian tạo (sẽ cập nhật khi thanh toán thành công)

### Dòng 144: Lưu Order vào database
```csharp
await _orderRepository.InsertAsync(order);
```
- **`InsertAsync`**: Thêm mới vào database (bất đồng bộ)
- **Sau khi insert**: Order sẽ có `Id` được tự động tạo

### Dòng 147-151: Lưu các OrderDetails
```csharp
foreach (var detail in orderDetails)
{
    detail.OrderId = order.Id;
    await _orderDetailRepository.InsertAsync(detail);
}
```
- **`foreach`**: Duyệt qua từng OrderDetail
- **`detail.OrderId = order.Id`**: Gán OrderId (liên kết với Order vừa tạo)
- **`InsertAsync`**: Lưu từng OrderDetail vào database

### Dòng 154: Map Order sang DTO
```csharp
var orderDto = ObjectMapper.Map<Models.Order.Order, OrderViewDto>(order);
```
- **`ObjectMapper`**: Tool của ABP Framework để chuyển đổi object
- **`Map<Source, Target>(source)`**: Chuyển từ Order sang OrderViewDto
- **Mục đích**: Chỉ trả về dữ liệu cần thiết cho frontend

### Dòng 155-164: Map OrderDetails sang DTO
```csharp
orderDto.OrderDetails = orderDetails.Select(d => new OrderDetailDto
{
    Id = d.Id,
    OrderId = d.OrderId,
    SubcriptionServiceId = d.SubcriptionServiceId,
    Quantity = d.Quantity,
    UnitPrice = d.UnitPrice,
    TotalPrice = d.TotalPrice,
    Notes = d.Notes
}).ToList();
```
- **`Select(...)`**: LINQ - chuyển đổi từng phần tử
- **`new OrderDetailDto`**: Tạo DTO mới cho mỗi OrderDetail
- **`.ToList()`**: Chuyển thành danh sách
- **Mục đích**: Tạo danh sách OrderDetailDto để trả về

### Dòng 167-171: Load tên dịch vụ
```csharp
foreach (var detailDto in orderDto.OrderDetails)
{
    var service = await _subcriptionServiceRepository.GetAsync(detailDto.SubcriptionServiceId);
    detailDto.SubcriptionServiceTitle = service.Title;
}
```
- **`foreach`**: Duyệt qua từng OrderDetailDto
- **`GetAsync(...)`**: Lấy lại thông tin dịch vụ từ database
- **`SubcriptionServiceTitle`**: Gán tên dịch vụ vào DTO
- **Mục đích**: Hiển thị tên dịch vụ trên frontend

### Dòng 173: Trả về kết quả
```csharp
return orderDto;
```
- Trả về `OrderViewDto` chứa đầy đủ thông tin đơn hàng

### Dòng 175-178: Xử lý exception
```csharp
catch (UserFriendlyException)
{
    throw; // Re-throw user-friendly exceptions as-is
}
```
- **`catch (UserFriendlyException)`**: Bắt exception thân thiện
- **`throw`**: Ném lại exception (không xử lý thêm)
- **Mục đích**: Giữ nguyên thông báo lỗi cho người dùng

### Dòng 179-183: Xử lý exception khác
```csharp
catch (Exception ex)
{
    _logger.LogError(ex, "Error creating order");
    throw new UserFriendlyException("An error occurred while creating the order");
}
```
- **`catch (Exception ex)`**: Bắt tất cả exception khác
- **`_logger.LogError(...)`**: Ghi log lỗi để debug
- **`throw new UserFriendlyException(...)`**: Ném exception thân thiện
- **Mục đích**: Ẩn lỗi kỹ thuật, chỉ hiển thị thông báo chung

---

## Tóm tắt luồng xử lý

1. **Validate**: Kiểm tra user đã đăng nhập, input hợp lệ
2. **Tính toán**: Duyệt qua từng sản phẩm, tính giá, tổng tiền
3. **Tạo Order**: Tạo mã đơn hàng, tạo object Order
4. **Lưu database**: Lưu Order và các OrderDetails
5. **Map DTO**: Chuyển đổi sang DTO để trả về frontend
6. **Load thêm**: Load tên dịch vụ cho mỗi OrderDetail
7. **Return**: Trả về OrderViewDto

---

## Lưu ý quan trọng

1. **VAT và Discount**: Hiện tại đang = 0, code tính toán đã bị comment
2. **PaidAt**: Được set = DateTime.UtcNow khi tạo, nhưng sẽ cập nhật lại khi thanh toán thành công
3. **Status**: Order mới tạo luôn có Status = Pending, PaymentStatus = Pending
4. **PaymentMethod**: Mặc định = VNPay
5. **OrderCode**: Tự động tạo, format: `ORD-YYYYMMDDHHmmss-XXXXXXXX`

