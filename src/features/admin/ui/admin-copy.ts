import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";

type AdminCopy = {
  sidebar: {
    home: string;
    menu: string;
    roleAdmin: string;
    roleDispatcher: string;
    toggleProductsSubpages: string;
    expandSidebar: string;
    collapseSidebar: string;
    items: {
      dashboard: string;
      orders: string;
      products: string;
      categories: string;
      delivery: string;
      discounts: string;
      coupons: string;
      users: string;
      analytics: string;
      blog: string;
      messages: string;
      settings: string;
      hero: string;
    };
  };
  common: {
    save: string;
    cancel: string;
    create: string;
    creating: string;
    saving: string;
    remove: string;
    changeImage: string;
    uploadImage: string;
  };
  pages: {
    pagination: {
      previous: string;
      next: string;
      page: string;
      of: string;
    };
    products: {
      addNewProduct: string;
      totalProducts: string;
      searchTitleOrSlug: string;
      searchSku: string;
      filterByCategory: string;
      filterByStock: string;
      allCategories: string;
      allProducts: string;
      inStock: string;
      outOfStock: string;
      lowStock: string;
      selectedProducts: string;
      deleteSelected: string;
      deleteConfirmSingle: string;
      deleteConfirmBulk: string;
      noProductsMatch: string;
      product: string;
      stock: string;
      price: string;
      category: string;
      featured: string;
      actions: string;
      created: string;
      selectAllProducts: string;
      stockUnit: string;
      notAvailableShort: string;
    };
    coupons: {
      title: string;
      subtitle: string;
      addPromoCode: string;
      noPromoCodes: string;
      code: string;
      type: string;
      value: string;
      usageLimit: string;
      used: string;
      active: string;
      validUntil: string;
      actions: string;
      percentOff: string;
      fixedAmount: string;
    };
    delivery: {
      title: string;
      subtitle: string;
      addLocation: string;
      noLocations: string;
      country: string;
      city: string;
      price: string;
      freeFrom: string;
      actions: string;
    };
    discounts: {
      title: string;
      globalTitle: string;
      globalSubtitle: string;
      globalNone: string;
      globalActive: string;
      globalCleared: string;
      globalSet: string;
      globalInvalid: string;
      categoryTitle: string;
      categorySubtitle: string;
      categoryNone: string;
      categorySaved: string;
      productTitle: string;
      productSubtitle: string;
      productSearch: string;
      productNone: string;
      productInvalid: string;
      productSaved: string;
      productCleared: string;
      infoTitle: string;
      infoSubtitle: string;
      infoMore: string;
      infoPoints: [string, string, string, string];
      clear: string;
    };
  };
  drawers: {
    category: {
      addTitle: string;
      editTitle: string;
      categoryTitle: string;
      categoryTitlePlaceholder: string;
      parentCategory: string;
      noParent: string;
      status: string;
      published: string;
      archived: string;
      image: string;
      createButton: string;
      uploadFailed: string;
      slugHint: string;
    };
    product: {
      addTitle: string;
      editTitle: string;
      fillTitleError: string;
      saveError: string;
      categories: string;
      selectCategories: string;
      addCategory: string;
      categoryTitleRequired: string;
      noCategoriesYet: string;
      modifiersLegend: string;
      additionsTitle: string;
      additionsSubtitle: string;
      additionsPlaceholder: string;
      exclusionsTitle: string;
      exclusionsSubtitle: string;
      exclusionsPlaceholder: string;
      modifierPricePlaceholder: string;
      mainImage: string;
      mainImageHint: string;
      mainImageTag: string;
      dietLegend: string;
      spicyLabel: string;
      vegetarianLabel: string;
      contentLanguage: string;
      contentLanguageHint: string;
      title: string;
      titlePlaceholder: string;
      description: string;
      descriptionPlaceholder: string;
      price: string;
      pricePlaceholder: string;
      compareAt: string;
      compareAtPlaceholder: string;
      sku: string;
    };
    delivery: {
      addTitle: string;
      editTitle: string;
      country: string;
      city: string;
      countryPlaceholder: string;
      cityPlaceholder: string;
      priceAmd: string;
      freeFromAmd: string;
    };
    coupon: {
      addTitle: string;
      editTitle: string;
      codeRequired: string;
      name: string;
      code: string;
      discountType: string;
      percentOff: string;
      fixedAmd: string;
      value: string;
      quantity: string;
      expiresOptional: string;
      allowedUsers: string;
      selectUsers: string;
      allUsersAllowed: string;
      selectedUsersCount: string;
      searchUsersPlaceholder: string;
      leaveEmptyHint: string;
      searchResults: string;
      searching: string;
      noUsersFound: string;
      maxUsersError: string;
    };
    blog: {
      addTitle: string;
      editTitle: string;
      requiredError: string;
      translations: string;
      title: string;
      shortExcerpt: string;
      fullText: string;
      fullTextHint: string;
      common: string;
      publicationDate: string;
      publicationDateHint: string;
      status: string;
      draft: string;
      published: string;
      archived: string;
      coverImage: string;
      imageFormatsHint: string;
      changeImage: string;
      uploadImage: string;
      remove: string;
    };
    hero: {
      addTitle: string;
      editTitle: string;
      title: string;
      subtitle: string;
      uploadImage: string;
    };
  };
};

const COPY: Record<Locale, AdminCopy> = {
  hy: {
    sidebar: {
      home: "Ադմինի գլխավոր",
      menu: "Մենյու",
      roleAdmin: "Ադմին",
      roleDispatcher: "Դիսպետչեր",
      toggleProductsSubpages: "Բացել/փակել ապրանքների ենթաբաժինները",
      expandSidebar: "Բացել sidebar-ը",
      collapseSidebar: "Փակել sidebar-ը",
      items: {
        dashboard: "Վահանակ",
        orders: "Պատվերներ",
        products: "Ապրանքներ",
        categories: "Կատեգորիաներ",
        delivery: "Առաքում",
        discounts: "Զեղչեր",
        coupons: "Կուպոններ",
        users: "Օգտատերեր",
        analytics: "Վերլուծություն",
        blog: "Բլոգ",
        messages: "Հաղորդագրություններ",
        settings: "Կարգավորումներ",
        hero: "Hero",
      },
    },
    common: { save: "Պահպանել", cancel: "Չեղարկել", create: "Ստեղծել", creating: "Ստեղծվում է…", saving: "Պահպանվում է…", remove: "Հեռացնել", changeImage: "Փոխել նկար", uploadImage: "+ Վերբեռնել նկար" },
    pages: {
      pagination: { previous: "Նախորդ", next: "Հաջորդ", page: "Էջ", of: "/" },
      products: { addNewProduct: "Ավելացնել նոր ապրանք", totalProducts: "Ընդամենը ապրանքներ", searchTitleOrSlug: "Որոնել վերնագրով կամ slug-ով", searchSku: "Որոնել SKU-ով", filterByCategory: "Ֆիլտր ըստ կատեգորիայի", filterByStock: "Ֆիլտր ըստ մնացորդի", allCategories: "Բոլոր կատեգորիաները", allProducts: "Բոլոր ապրանքները", inStock: "Առկա", outOfStock: "Չկա", lowStock: "Քիչ մնացորդ", selectedProducts: "Ընտրված ապրանքներ", deleteSelected: "Ջնջել ընտրվածը", deleteConfirmSingle: "Համոզվա՞ծ եք, որ ուզում եք ջնջել «{label}»-ը։", deleteConfirmBulk: "Համոզվա՞ծ եք, որ ուզում եք ջնջել {count} ապրանք։", noProductsMatch: "Ապրանքներ չգտնվեցին այս ֆիլտրերով։", product: "Ապրանք", stock: "Մնացորդ", price: "Գին", category: "Կատեգորիա", featured: "Առաջարկվող", actions: "Գործողություններ", created: "Ստեղծված", selectAllProducts: "Ընտրել բոլոր ապրանքները", stockUnit: "հատ", notAvailableShort: "Չկա" },
      coupons: { title: "Պրոմո կոդեր", subtitle: "Ստեղծեք, խմբագրեք կամ հեռացրեք զեղչային կոդերը checkout-ի համար։", addPromoCode: "Ավելացնել պրոմո կոդ", noPromoCodes: "Պրոմո կոդեր դեռ չկան։", code: "Կոդ", type: "Տեսակ", value: "Արժեք", usageLimit: "Օգտ. սահման", used: "Օգտագործվել է", active: "Ակտիվ", validUntil: "Վավեր մինչև", actions: "Գործողություններ", percentOff: "Տոկոսային", fixedAmount: "Ֆիքսված (AMD)" },
      delivery: { title: "Առաքում", subtitle: "Սահմանեք առաքման գները ըստ երկրի և քաղաքի։", addLocation: "Ավելացնել հասցե", noLocations: "Առաքման հասցեներ դեռ չկան։", country: "Երկիր", city: "Քաղաք", price: "Գին", freeFrom: "Անվճար՝ սկսած", actions: "Գործողություններ" },
      discounts: { title: "Զեղչեր", globalTitle: "Գլոբալ զեղչ", globalSubtitle: "Բոլոր ապրանքների համար", globalNone: "Գլոբալ զեղչ չկա։ Մուտքագրեք տոկոս։", globalActive: "Ակտիվ գլոբալ զեղչ՝ {value}%", globalCleared: "Գլոբալ զեղչը հեռացվեց։", globalSet: "Գլոբալ զեղչը դրվեց՝ {value}%", globalInvalid: "Մուտքագրեք ամբողջ թիվ 1-ից 100։", categoryTitle: "Կատեգորիաների զեղչ", categorySubtitle: "Կիրառվում է կատեգորիայի բոլոր ապրանքներին", categoryNone: "Կատեգորիաներ չեն գտնվել", categorySaved: "Պահպանվեց {count} կատեգորիայի զեղչ", productTitle: "Ապրանքների զեղչ", productSubtitle: "Յուրաքանչյուր ապրանքի առանձին տոկոս", productSearch: "Որոնել վերնագրով կամ slug-ով...", productNone: "Ապրանքներ չկան", productInvalid: "Սխալ տոկոս «{title}»-ի համար։ Օգտագործեք 1–100։", productSaved: "Պահպանվեց {value}% «{title}»-ի համար։", productCleared: "«{title}»-ի զեղչը հեռացվեց։", infoTitle: "Օգտակար տեղեկություն", infoSubtitle: "Զեղչերի մասին", infoMore: "Այլ կարգավորումներ →", infoPoints: ["Գլոբալ զեղչը կիրառվում է բոլոր ապրանքների վրա։", "Կատեգորիայի զեղչը կիրառվում է տվյալ կատեգորիայի ապրանքներին։", "Ապրանքի զեղչը գերակայում է մնացածին։", "Clear-ը հեռացնում է կանոնը, Save-ը պահպանում է։"], clear: "Մաքրել" },
    },
    drawers: {
      category: {
        addTitle: "Ավելացնել կատեգորիա",
        editTitle: "Խմբագրել կատեգորիան",
        categoryTitle: "Կատեգորիայի անուն",
        categoryTitlePlaceholder: "Մուտքագրեք կատեգորիայի անունը",
        parentCategory: "Ծնող կատեգորիա",
        noParent: "Չկա (արմատային)",
        status: "Կարգավիճակ",
        published: "Հրապարակված",
        archived: "Արխիվացված",
        image: "Նկար",
        createButton: "Ստեղծել կատեգորիա",
        uploadFailed: "Վերբեռնումը չհաջողվեց։ Փորձեք փոքր նկար։",
        slugHint: "Անգլերեն slug-ը օգտագործվում է բոլոր լեզուների URL-ներում։",
      },
      product: {
        addTitle: "Ավելացնել նոր ապրանք",
        editTitle: "Խմբագրել ապրանքը",
        fillTitleError: "Լրացրեք վերնագիր գոնե մեկ լեզվի համար (HY / EN / RU):",
        saveError: "Չհաջողվեց պահպանել ապրանքը։ Փորձեք այլ SKU կամ վերնագիր։",
        categories: "Կատեգորիաներ",
        selectCategories: "Ընտրեք կատեգորիաներ",
        addCategory: "Ավելացնել կատեգորիա",
        categoryTitleRequired: "Կատեգորիայի անունը պարտադիր է։",
        noCategoriesYet: "Կատեգորիաներ դեռ չկան։",
        modifiersLegend: "Ավելացումներ / Բացառումներ",
        additionsTitle: "Ավելացումներ",
        additionsSubtitle: "լրացուցիչ + գին",
        additionsPlaceholder: "Նոր ավելացում...",
        exclusionsTitle: "Բացառումներ (բաղադրիչներ)",
        exclusionsSubtitle: "ներառված են սկզբից",
        exclusionsPlaceholder: "Նոր բաղադրիչ...",
        modifierPricePlaceholder: "Գին",
        mainImage: "Ապրանքի նկարներ",
        mainImageHint: "Վերբեռնեք մեկ կամ մի քանի նկար, հետո ընտրեք հիմնականը։",
        mainImageTag: "Հիմնական",
        dietLegend: "Կծու / Բուսակեր",
        spicyLabel: "Կծու",
        vegetarianLabel: "Բուսակեր",
        contentLanguage: "Բովանդակության լեզու",
        contentLanguageHint: "Փոխեք HY / EN / RU — վերնագիրն ու նկարագրությունը առանձին են։",
        title: "Վերնագիր",
        titlePlaceholder: "Ապրանքի վերնագիր",
        description: "Նկարագրություն",
        descriptionPlaceholder: "Ապրանքի նկարագրություն",
        price: "Գին",
        pricePlaceholder: "AMD գին",
        compareAt: "Համեմատական գին",
        compareAtPlaceholder: "Ընտրովի",
        sku: "SKU",
      },
      delivery: {
        addTitle: "Ավելացնել հասցե",
        editTitle: "Խմբագրել հասցեն",
        country: "Երկիր",
        city: "Քաղաք",
        countryPlaceholder: "Armenia",
        cityPlaceholder: "Yerevan",
        priceAmd: "Գին (AMD)",
        freeFromAmd: "Անվճար առաքում սկսած (AMD)",
      },
      coupon: {
        addTitle: "Նոր կուպոն",
        editTitle: "Խմբագրել կուպոնը",
        codeRequired: "Կոդը պարտադիր է։",
        name: "Անուն",
        code: "Կոդ",
        discountType: "Զեղչի տեսակ",
        percentOff: "Տոկոսային զեղչ",
        fixedAmd: "Ֆիքսված գումար (AMD)",
        value: "Արժեք",
        quantity: "Քանակ",
        expiresOptional: "Ավարտ (ընտրովի)",
        allowedUsers: "Թույլատրված օգտատերեր",
        selectUsers: "Ընտրել օգտատերեր",
        allUsersAllowed: "Կուպոնը հասանելի է բոլորին",
        selectedUsersCount: "{count} ընտրված օգտատեր",
        searchUsersPlaceholder: "Որոնել անունով, email-ով կամ հեռախոսով",
        leaveEmptyHint: "Դատարկ թողեք, որ հասանելի լինի բոլորին։",
        searchResults: "Որոնման արդյունքներ",
        searching: "Որոնում…",
        noUsersFound: "Օգտատեր չգտնվեց։",
        maxUsersError: "Կարող եք ընտրել մինչև {count} օգտատեր։",
      },
      blog: {
        addTitle: "Ավելացնել բլոգ գրառում",
        editTitle: "Խմբագրել բլոգ գրառումը",
        requiredError: "Վերնագիրն ու ամբողջական տեքստը պարտադիր են։",
        translations: "Թարգմանություններ",
        title: "Վերնագիր",
        shortExcerpt: "Կարճ նկարագիր",
        fullText: "Ամբողջական տեքստ",
        fullTextHint: "Կարող է լինել plain text կամ HTML։",
        common: "Ընդհանուր",
        publicationDate: "Հրապարակման օր",
        publicationDateHint: "Դատարկ թողնելու դեպքում կհրապարակվի այսօրվա ամսաթվով։",
        status: "Կարգավիճակ",
        draft: "Սևագիր",
        published: "Հրապարակված",
        archived: "Արխիվացված",
        coverImage: "Շապիկի նկար",
        imageFormatsHint: "JPEG, PNG, WebP կամ GIF։ Մաքս՝ 5MB։",
        changeImage: "Փոխել նկար",
        uploadImage: "+ Վերբեռնել նկար",
        remove: "Հեռացնել",
      },
      hero: { addTitle: "Ստեղծել hero slide", editTitle: "Խմբագրել hero slide-ը", title: "Վերնագիր", subtitle: "Ենթավերնագիր", uploadImage: "Վերբեռնել նկար" },
    },
  },
  en: {
    sidebar: {
      home: "Admin home", menu: "Menu", roleAdmin: "Admin", roleDispatcher: "Dispatcher", toggleProductsSubpages: "Toggle product subpages", expandSidebar: "Expand sidebar", collapseSidebar: "Collapse sidebar",
      items: { dashboard: "Dashboard", orders: "Orders", products: "Products", categories: "Categories", delivery: "Delivery", discounts: "Discounts", coupons: "Coupons", users: "Users", analytics: "Analytics", blog: "Blog", messages: "Messages", settings: "Settings", hero: "Hero" },
    },
    common: { save: "Save", cancel: "Cancel", create: "Create", creating: "Creating…", saving: "Saving…", remove: "Remove", changeImage: "Change image", uploadImage: "+ Upload image" },
    pages: {
      pagination: { previous: "Previous", next: "Next", page: "Page", of: "/" },
      products: { addNewProduct: "Add New Product", totalProducts: "Total products", searchTitleOrSlug: "Search by title or slug", searchSku: "Search by SKU", filterByCategory: "Filter by category", filterByStock: "Filter by stock", allCategories: "All Categories", allProducts: "All Products", inStock: "In stock", outOfStock: "Out of stock", lowStock: "Low stock", selectedProducts: "Selected products", deleteSelected: "Delete Selected", deleteConfirmSingle: "Are you sure you want to delete \"{label}\"?", deleteConfirmBulk: "Are you sure you want to delete {count} selected products?", noProductsMatch: "No products match these filters.", product: "Product", stock: "Stock", price: "Price", category: "Category", featured: "Featured", actions: "Actions", created: "Created", selectAllProducts: "Select all products", stockUnit: "pcs", notAvailableShort: "N/A" },
      coupons: { title: "Promo codes", subtitle: "Create, edit, or remove discount codes for checkout.", addPromoCode: "Add Promo Code", noPromoCodes: "No promo codes yet.", code: "Code", type: "Type", value: "Value", usageLimit: "Usage limit", used: "Used", active: "Active", validUntil: "Valid until", actions: "Actions", percentOff: "Percent off", fixedAmount: "Fixed amount (AMD)" },
      delivery: { title: "Delivery", subtitle: "Set delivery prices by country and city for checkout.", addLocation: "Add Location", noLocations: "No delivery locations yet. Add a location to offer delivery at checkout.", country: "Country", city: "City", price: "Price", freeFrom: "Free from", actions: "Actions" },
      discounts: { title: "Discounts", globalTitle: "Global Discount", globalSubtitle: "For all products", globalNone: "No global discount. Enter percentage (0-100) to discount all products.", globalActive: "Active global discount: {value}%.", globalCleared: "Global discount cleared.", globalSet: "Global discount set to {value}%.", globalInvalid: "Enter a whole number from 1 to 100, or leave empty.", categoryTitle: "Category Discounts", categorySubtitle: "Apply discounts to each product within a category", categoryNone: "No categories found", categorySaved: "Saved {count} category discount(s).", productTitle: "Product Discounts", productSubtitle: "Set individual discount percentage for each product", productSearch: "Search by title or slug...", productNone: "No products found", productInvalid: "Invalid percentage for \"{title}\". Use 1-100.", productSaved: "Saved {value}% for \"{title}\".", productCleared: "Cleared discount for \"{title}\".", infoTitle: "Useful Information", infoSubtitle: "About Discounts", infoMore: "More Settings →", infoPoints: ["Global discount applies to every product unless a stronger product rule exists.", "Category discount applies to products in that category.", "Product discount overrides category and global percentage for that item.", "Clear removes the rule; Save persists the current percentage."], clear: "Clear" },
    },
    drawers: {
      category: { addTitle: "Add category", editTitle: "Edit category", categoryTitle: "Category title", categoryTitlePlaceholder: "Enter category title", parentCategory: "Parent category", noParent: "None (Root category)", status: "Status", published: "Published", archived: "Archived", image: "Image", createButton: "Create category", uploadFailed: "Upload failed. Try a smaller image.", slugHint: "English slug is used in all storefront URLs." },
      product: { addTitle: "Add new product", editTitle: "Edit product", fillTitleError: "Fill title for at least one language (HY / EN / RU).", saveError: "Unable to save product. Try a different SKU or title.", categories: "Categories", selectCategories: "Select categories", addCategory: "Add category", categoryTitleRequired: "Category title is required.", noCategoriesYet: "No categories yet.", modifiersLegend: "Additions / Exclusions", additionsTitle: "Additions", additionsSubtitle: "extras + price", additionsPlaceholder: "New addition...", exclusionsTitle: "Exclusions (ingredients)", exclusionsSubtitle: "included by default", exclusionsPlaceholder: "New ingredient...", modifierPricePlaceholder: "Price", mainImage: "Product images", mainImageHint: "Upload one or more images, then choose the main one.", mainImageTag: "Main", dietLegend: "Spicy / Vegetarian", spicyLabel: "Spicy", vegetarianLabel: "Vegetarian", contentLanguage: "Content language", contentLanguageHint: "Switch HY / EN / RU — title and description are per-language.", title: "Title", titlePlaceholder: "Product title", description: "Description", descriptionPlaceholder: "Product description", price: "Price", pricePlaceholder: "AMD price", compareAt: "Compare at price", compareAtPlaceholder: "Optional", sku: "SKU" },
      delivery: { addTitle: "Add location", editTitle: "Edit location", country: "Country", city: "City", countryPlaceholder: "Armenia", cityPlaceholder: "Yerevan", priceAmd: "Price (AMD)", freeFromAmd: "Free delivery from (AMD)" },
      coupon: { addTitle: "New coupon", editTitle: "Edit coupon", codeRequired: "Code is required.", name: "Name", code: "Code", discountType: "Discount type", percentOff: "Percent off", fixedAmd: "Fixed amount (AMD)", value: "Value", quantity: "Quantity", expiresOptional: "Expires (optional)", allowedUsers: "Allowed users", selectUsers: "Select users", allUsersAllowed: "All users can use this coupon", selectedUsersCount: "{count} selected user(s)", searchUsersPlaceholder: "Search by name, email, or phone", leaveEmptyHint: "Leave empty to allow all users.", searchResults: "Search results", searching: "Searching…", noUsersFound: "No users found.", maxUsersError: "You can select up to {count} users." },
      blog: { addTitle: "Add blog post", editTitle: "Edit blog post", requiredError: "Title and full text are required.", translations: "Translations", title: "Title", shortExcerpt: "Short excerpt", fullText: "Full text", fullTextHint: "Plain text or HTML. Double line breaks create new paragraphs.", common: "Common", publicationDate: "Publication date", publicationDateHint: "Leave empty to use today when publishing.", status: "Status", draft: "Draft", published: "Published", archived: "Archived", coverImage: "Cover image", imageFormatsHint: "JPEG, PNG, WebP, or GIF. Max 5MB.", changeImage: "Change image", uploadImage: "+ Upload image", remove: "Remove" },
      hero: { addTitle: "Create hero slide", editTitle: "Edit hero slide", title: "Title", subtitle: "Subtitle", uploadImage: "Upload image" },
    },
  },
  ru: {
    sidebar: {
      home: "Главная админки", menu: "Меню", roleAdmin: "Админ", roleDispatcher: "Диспетчер", toggleProductsSubpages: "Переключить подпункты товаров", expandSidebar: "Развернуть сайдбар", collapseSidebar: "Свернуть сайдбар",
      items: { dashboard: "Панель", orders: "Заказы", products: "Товары", categories: "Категории", delivery: "Доставка", discounts: "Скидки", coupons: "Купоны", users: "Пользователи", analytics: "Аналитика", blog: "Блог", messages: "Сообщения", settings: "Настройки", hero: "Hero" },
    },
    common: { save: "Сохранить", cancel: "Отмена", create: "Создать", creating: "Создание…", saving: "Сохранение…", remove: "Удалить", changeImage: "Изменить изображение", uploadImage: "+ Загрузить изображение" },
    pages: {
      pagination: { previous: "Назад", next: "Вперед", page: "Страница", of: "/" },
      products: { addNewProduct: "Добавить товар", totalProducts: "Всего товаров", searchTitleOrSlug: "Поиск по названию или slug", searchSku: "Поиск по SKU", filterByCategory: "Фильтр по категории", filterByStock: "Фильтр по остатку", allCategories: "Все категории", allProducts: "Все товары", inStock: "В наличии", outOfStock: "Нет в наличии", lowStock: "Мало на складе", selectedProducts: "Выбрано товаров", deleteSelected: "Удалить выбранное", deleteConfirmSingle: "Вы уверены, что хотите удалить \"{label}\"?", deleteConfirmBulk: "Вы уверены, что хотите удалить выбранных товаров: {count}?", noProductsMatch: "Нет товаров по этим фильтрам.", product: "Товар", stock: "Остаток", price: "Цена", category: "Категория", featured: "Рекомендуемое", actions: "Действия", created: "Создан", selectAllProducts: "Выбрать все товары", stockUnit: "шт", notAvailableShort: "Н/Д" },
      coupons: { title: "Промокоды", subtitle: "Создавайте, редактируйте и удаляйте скидочные коды для checkout.", addPromoCode: "Добавить промокод", noPromoCodes: "Промокодов пока нет.", code: "Код", type: "Тип", value: "Значение", usageLimit: "Лимит", used: "Использовано", active: "Активен", validUntil: "Действует до", actions: "Действия", percentOff: "Процент", fixedAmount: "Фиксированная сумма (AMD)" },
      delivery: { title: "Доставка", subtitle: "Укажите стоимость доставки по странам и городам.", addLocation: "Добавить локацию", noLocations: "Локаций доставки пока нет. Добавьте локацию для доставки.", country: "Страна", city: "Город", price: "Цена", freeFrom: "Бесплатно от", actions: "Действия" },
      discounts: { title: "Скидки", globalTitle: "Глобальная скидка", globalSubtitle: "Для всех товаров", globalNone: "Глобальной скидки нет. Введите процент.", globalActive: "Активная глобальная скидка: {value}%.", globalCleared: "Глобальная скидка удалена.", globalSet: "Глобальная скидка установлена: {value}%.", globalInvalid: "Введите целое число от 1 до 100 или оставьте пусто.", categoryTitle: "Скидки по категориям", categorySubtitle: "Применяются ко всем товарам категории", categoryNone: "Категории не найдены", categorySaved: "Сохранено скидок по категориям: {count}.", productTitle: "Скидки по товарам", productSubtitle: "Индивидуальный процент для каждого товара", productSearch: "Поиск по названию или slug...", productNone: "Товары не найдены", productInvalid: "Некорректный процент для \"{title}\". Используйте 1-100.", productSaved: "Сохранено {value}% для \"{title}\".", productCleared: "Скидка для \"{title}\" удалена.", infoTitle: "Полезная информация", infoSubtitle: "О скидках", infoMore: "Другие настройки →", infoPoints: ["Глобальная скидка применяется ко всем товарам, если нет более сильного правила.", "Скидка категории применяется к товарам этой категории.", "Скидка товара имеет приоритет над скидкой категории и глобальной.", "Clear удаляет правило, Save сохраняет текущий процент."], clear: "Очистить" },
    },
    drawers: {
      category: { addTitle: "Добавить категорию", editTitle: "Редактировать категорию", categoryTitle: "Название категории", categoryTitlePlaceholder: "Введите название категории", parentCategory: "Родительская категория", noParent: "Нет (корневая)", status: "Статус", published: "Опубликовано", archived: "В архиве", image: "Изображение", createButton: "Создать категорию", uploadFailed: "Ошибка загрузки. Попробуйте файл меньшего размера.", slugHint: "Английский slug используется во всех URL витрины." },
      product: { addTitle: "Добавить товар", editTitle: "Редактировать товар", fillTitleError: "Заполните название хотя бы для одного языка (HY / EN / RU).", saveError: "Не удалось сохранить товар. Попробуйте другой SKU или заголовок.", categories: "Категории", selectCategories: "Выберите категории", addCategory: "Добавить категорию", categoryTitleRequired: "Название категории обязательно.", noCategoriesYet: "Категорий пока нет.", modifiersLegend: "Добавки / Исключения", additionsTitle: "Добавки", additionsSubtitle: "дополнительно + цена", additionsPlaceholder: "Новая добавка...", exclusionsTitle: "Исключения (ингредиенты)", exclusionsSubtitle: "включены по умолчанию", exclusionsPlaceholder: "Новый ингредиент...", modifierPricePlaceholder: "Цена", mainImage: "Изображения товара", mainImageHint: "Загрузите одно или несколько изображений и выберите главное.", mainImageTag: "Главное", dietLegend: "Острое / Вегетарианское", spicyLabel: "Острое", vegetarianLabel: "Вегетарианское", contentLanguage: "Язык контента", contentLanguageHint: "Переключайте HY / EN / RU — заголовок и описание отдельные.", title: "Название", titlePlaceholder: "Название товара", description: "Описание", descriptionPlaceholder: "Описание товара", price: "Цена", pricePlaceholder: "Цена в AMD", compareAt: "Старая цена", compareAtPlaceholder: "Необязательно", sku: "SKU" },
      delivery: { addTitle: "Добавить локацию", editTitle: "Редактировать локацию", country: "Страна", city: "Город", countryPlaceholder: "Armenia", cityPlaceholder: "Yerevan", priceAmd: "Цена (AMD)", freeFromAmd: "Бесплатная доставка от (AMD)" },
      coupon: { addTitle: "Новый купон", editTitle: "Редактировать купон", codeRequired: "Код обязателен.", name: "Название", code: "Код", discountType: "Тип скидки", percentOff: "Процент скидки", fixedAmd: "Фиксированная сумма (AMD)", value: "Значение", quantity: "Количество", expiresOptional: "Срок действия (необязательно)", allowedUsers: "Разрешенные пользователи", selectUsers: "Выбрать пользователей", allUsersAllowed: "Купон доступен всем пользователям", selectedUsersCount: "{count} выбранных пользователей", searchUsersPlaceholder: "Поиск по имени, email или телефону", leaveEmptyHint: "Оставьте пустым, чтобы разрешить всем.", searchResults: "Результаты поиска", searching: "Поиск…", noUsersFound: "Пользователи не найдены.", maxUsersError: "Можно выбрать до {count} пользователей." },
      blog: { addTitle: "Добавить пост", editTitle: "Редактировать пост", requiredError: "Название и полный текст обязательны.", translations: "Переводы", title: "Название", shortExcerpt: "Краткое описание", fullText: "Полный текст", fullTextHint: "Можно plain text или HTML.", common: "Общее", publicationDate: "Дата публикации", publicationDateHint: "Оставьте пустым, чтобы использовать сегодняшнюю дату.", status: "Статус", draft: "Черновик", published: "Опубликовано", archived: "В архиве", coverImage: "Обложка", imageFormatsHint: "JPEG, PNG, WebP или GIF. Макс. 5MB.", changeImage: "Изменить изображение", uploadImage: "+ Загрузить изображение", remove: "Удалить" },
      hero: { addTitle: "Создать hero-слайд", editTitle: "Редактировать hero-слайд", title: "Заголовок", subtitle: "Подзаголовок", uploadImage: "Загрузить изображение" },
    },
  },
};

export function getAdminCopy(locale: string): AdminCopy {
  const safeLocale = isLocale(locale) ? locale : defaultLocale;
  return COPY[safeLocale];
}
